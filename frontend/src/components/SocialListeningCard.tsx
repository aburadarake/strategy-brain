"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, SocialListeningInput, SocialListeningResult } from "@/lib/api";

const VOLUME_COLOR = {
  "多い": "bg-emerald-100 text-emerald-700",
  "中程度": "bg-amber-100 text-amber-700",
  "少ない": "bg-gray-100 text-ink-muted",
};

const SENTIMENT_COLOR = {
  "ポジティブ": "bg-emerald-50 border-emerald-200",
  "ネガティブ": "bg-red-50 border-red-200",
  "ニュートラル": "bg-gray-50 border-gray-200",
};

export default function SocialListeningCard() {
  const [input, setInput] = useState<SocialListeningInput>({
    brand_category: "",
    sns_data: "",
    context: "",
  });
  const [result, setResult] = useState<SocialListeningResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"patterns" | "insights" | "strategy">("insights");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.brand_category.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.socialListening(input);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const TABS = [
    { id: "insights" as const, label: "インサイト軸" },
    { id: "patterns" as const, label: "発話パターン" },
    { id: "strategy" as const, label: "戦略示唆" },
  ];

  return (
    <div className="space-y-6">
      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            ブランド名・カテゴリ名
          </label>
          <input
            type="text"
            value={input.brand_category}
            onChange={(e) => setInput(prev => ({ ...prev, brand_category: e.target.value }))}
            placeholder="例: レッドブル、プロテインドリンク、ランニングシューズ..."
            required
            className="w-full text-lg font-semibold text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            SNS投稿データ（任意 — Grok等で収集したデータを貼り付け）
          </label>
          <textarea
            value={input.sns_data}
            onChange={(e) => setInput(prev => ({ ...prev, sns_data: e.target.value }))}
            placeholder="Grokで収集したX投稿データをここに貼り付けてください。空欄の場合はカテゴリの一般的な傾向から分析します..."
            rows={6}
            className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors font-mono"
          />
          <p className="text-xs text-ink-faint mt-1.5">
            Grok → DeepSearch → 「{"{ブランド名}"}について語られているXの投稿を分析してください」で収集
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            追加コンテキスト（任意）
          </label>
          <input
            type="text"
            value={input.context}
            onChange={(e) => setInput(prev => ({ ...prev, context: e.target.value }))}
            placeholder="特に注目したいキャンペーン、時期、競合など..."
            className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!input.brand_category.trim() || isLoading}
          className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
          style={{ background: input.brand_category.trim() && !isLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
        >
          {isLoading ? "分析中（1〜2分）..." : "ソーシャルリスニング分析を実行"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">{result.brand_category}</h3>
            <span className="text-xs text-ink-faint">{result.patterns.length}パターン / {result.insight_categories.length}インサイト軸</span>
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

          {activeTab === "insights" && (
            <div className="space-y-3">
              {result.insight_categories.map((ic, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-ink">{ic.category_name}</p>
                      <p className="text-sm text-ink-muted italic mt-0.5">「{ic.consumer_voice}」</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${VOLUME_COLOR[ic.volume as keyof typeof VOLUME_COLOR] || "bg-gray-100 text-ink-muted"}`}>
                      {ic.volume}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted mb-3">{ic.description}</p>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-600 mb-1">コアインサイト</p>
                    <p className="text-sm text-ink">{ic.key_insight}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "patterns" && (
            <div className="space-y-3">
              {result.patterns.map((p, i) => (
                <div key={i} className={`border rounded-2xl p-4 ${SENTIMENT_COLOR[p.sentiment as keyof typeof SENTIMENT_COLOR] || "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-ink">{p.pattern_name}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${VOLUME_COLOR[p.volume as keyof typeof VOLUME_COLOR] || "bg-gray-100 text-ink-muted"}`}>{p.volume}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 text-ink-muted">{p.tone}</span>
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted mb-2">{p.description}</p>
                  {p.examples.length > 0 && (
                    <div className="space-y-1">
                      {p.examples.slice(0, 2).map((ex, j) => (
                        <p key={j} className="text-xs text-ink-muted bg-white/60 rounded-lg px-3 py-1.5">「{ex}」</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">語られていない空白地帯</p>
                <div className="space-y-2">
                  {result.untold_areas.map((area, i) => (
                    <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="w-5 h-5 bg-gray-200 text-ink rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-ink">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">コミュニケーション戦略の方向（3つ）</p>
                <div className="space-y-3">
                  {result.strategic_directions.map((dir, i) => (
                    <div key={i} className="bg-black text-white rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-white/50 text-xs font-bold flex-shrink-0 mt-0.5">0{i + 1}</span>
                        <p className="text-sm leading-relaxed">{dir}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => { setResult(null); setInput({ brand_category: "", sns_data: "", context: "" }); }}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            新しいブランドを分析する
          </button>
        </motion.div>
      )}
    </div>
  );
}
