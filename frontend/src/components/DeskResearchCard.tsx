"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, DeskResearchInput, DeskResearchResult, DeskResearchStage2 } from "@/lib/api";

export default function DeskResearchCard() {
  const [input, setInput] = useState<DeskResearchInput>({ category: "", context: "" });
  const [result, setResult] = useState<DeskResearchResult | null>(null);
  const [deepDiveInput, setDeepDiveInput] = useState("");
  const [deepDiveResult, setDeepDiveResult] = useState<DeskResearchStage2 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"market" | "comms" | "blindspots" | "points">("market");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.category.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setDeepDiveResult(null);
    try {
      const res = await api.deskResearch({ ...input, deep_dive_focus: "" });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepDive = async () => {
    if (!deepDiveInput.trim() || !result) return;
    setIsDeepLoading(true);
    try {
      const res = await api.deskResearchDeepDive({ category: result.category, deep_dive_focus: deepDiveInput });
      setDeepDiveResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsDeepLoading(false);
    }
  };

  const TABS = [
    { id: "market" as const, label: "市場構造" },
    { id: "comms" as const, label: "コミュニケーション" },
    { id: "blindspots" as const, label: "盲点" },
    { id: "points" as const, label: "論点" },
  ];

  return (
    <div className="space-y-6">
      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            業種・カテゴリ
          </label>
          <input
            type="text"
            value={input.category}
            onChange={(e) => setInput(prev => ({ ...prev, category: e.target.value }))}
            placeholder="例: 電動キックボード、プロテインドリンク、音楽ストリーミング..."
            required
            className="w-full text-lg font-semibold text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            追加情報（任意）
          </label>
          <textarea
            value={input.context}
            onChange={(e) => setInput(prev => ({ ...prev, context: e.target.value }))}
            placeholder="クライアントの背景、特に気になるポイントなど..."
            rows={2}
            className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={!input.category.trim() || isLoading}
          className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
          style={{ background: input.category.trim() && !isLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
        >
          {isLoading ? "リサーチ中（1〜2分）..." : "第1段階：俯瞰マップを生成"}
        </button>
      </form>

      {/* Stage 1 Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <h3 className="font-semibold text-ink">俯瞰マップ: {result.category}</h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "market" && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{result.stage1.market_structure}</p>
            </div>
          )}

          {activeTab === "comms" && (
            <div className="space-y-3">
              {result.stage1.player_communications.map((pc, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="font-semibold text-ink mb-3">{pc.player_name}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-ink-faint mb-1">広告アプローチ</p>
                      <p className="text-ink">{pc.ad_approach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-faint mb-1">ターゲット定義</p>
                      <p className="text-ink">{pc.target_definition}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-ink-faint mb-1">コンテンツスタイル</p>
                      <p className="text-ink">{pc.content_style}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "blindspots" && (
            <div className="space-y-3">
              {result.stage1.blind_spots.map((bs, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-ink mb-1">{bs.title}</p>
                      <p className="text-sm text-ink-muted">{bs.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "points" && (
            <div className="space-y-3">
              {result.stage1.discussion_points.map((dp, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gray-100 text-ink rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-ink mb-1">{dp.title}</p>
                      <p className="text-sm text-ink-muted mb-2">{dp.description}</p>
                      {dp.why_interesting && (
                        <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{dp.why_interesting}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stage 2: Deep Dive */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-ink text-xs font-bold">2</div>
              <h3 className="font-semibold text-ink">第2段階：深掘り</h3>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={deepDiveInput}
                onChange={(e) => setDeepDiveInput(e.target.value)}
                placeholder="盲点や論点から気になるポイントを入力..."
                className="flex-1 text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
              <button
                onClick={handleDeepDive}
                disabled={!deepDiveInput.trim() || isDeepLoading}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: deepDiveInput.trim() && !isDeepLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
              >
                {isDeepLoading ? "深掘り中..." : "深掘り"}
              </button>
            </div>
          </div>

          {/* Deep Dive Result */}
          {deepDiveResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h4 className="font-semibold text-ink">深掘り: {deepDiveResult.focus}</h4>

              <div>
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">歴史の3段階</p>
                <div className="space-y-3">
                  {deepDiveResult.history_stages.map((h, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                        {i < deepDiveResult.history_stages.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-ink mb-1">{h.period}</p>
                        <p className="text-sm text-ink-muted mb-1">{h.description}</p>
                        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">{h.why_it_changed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">断絶点・境界線</p>
                <div className="space-y-3">
                  {deepDiveResult.disruption_points.map((dp, i) => (
                    <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <p className="font-semibold text-ink mb-1">{dp.title}</p>
                      <p className="text-sm text-ink-muted mb-2">{dp.description}</p>
                      <p className="text-xs text-red-600">{dp.scenario}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">コミュニケーション機会</p>
                <div className="space-y-2">
                  {deepDiveResult.opportunities.map((opp, i) => (
                    <div key={i} className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-ink">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <button
            onClick={() => { setResult(null); setDeepDiveResult(null); setInput({ category: "", context: "" }); }}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            新しいカテゴリを調査する
          </button>
        </motion.div>
      )}
    </div>
  );
}
