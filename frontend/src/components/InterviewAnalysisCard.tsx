"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, InterviewAnalysisInput, InterviewAnalysisResult } from "@/lib/api";

const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  "事実": { bg: "bg-blue-50", text: "text-blue-700", label: "事実" },
  "感情": { bg: "bg-purple-50", text: "text-purple-700", label: "感情" },
  "矛盾": { bg: "bg-red-50", text: "text-red-700", label: "矛盾" },
  "示唆": { bg: "bg-amber-50", text: "text-amber-700", label: "示唆" },
};

const PATTERN_STYLE: Record<string, string> = {
  "共通": "bg-emerald-50 border-emerald-200",
  "特異": "bg-purple-50 border-purple-200",
  "分岐点": "bg-amber-50 border-amber-200",
};

export default function InterviewAnalysisCard() {
  const [input, setInput] = useState<InterviewAnalysisInput>({
    transcript: "",
    research_goal: "",
    context: "",
  });
  const [result, setResult] = useState<InterviewAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "patterns" | "statements" | "strategy">("insights");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.transcript.trim() || !input.research_goal.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.interviewAnalysis(input);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const TABS = [
    { id: "insights" as const, label: "インサイト" },
    { id: "patterns" as const, label: "パターン" },
    { id: "statements" as const, label: "重要発言" },
    { id: "strategy" as const, label: "戦略示唆" },
  ];

  return (
    <div className="space-y-6">
      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            調査目的
          </label>
          <input
            type="text"
            value={input.research_goal}
            onChange={(e) => setInput(prev => ({ ...prev, research_goal: e.target.value }))}
            placeholder="例: ウイスキーの購買行動とブランド選択基準を理解する..."
            required
            className="w-full text-base text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            インタビュー発話録
          </label>
          <textarea
            value={input.transcript}
            onChange={(e) => setInput(prev => ({ ...prev, transcript: e.target.value }))}
            placeholder={`インタビューの文字起こしを貼り付けてください。\n\n例:\nI: ○○はどんな時に使いますか？\nA: えー、仕事終わりに1杯飲みたいとき...\n\n複数名の発話録でも可。CLOVA Note、Otter等の自動文字起こしそのままでも可。`}
            rows={10}
            required
            className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
            調査背景（任意）
          </label>
          <input
            type="text"
            value={input.context}
            onChange={(e) => setInput(prev => ({ ...prev, context: e.target.value }))}
            placeholder="対象者プロフィール、調査背景、ブランドの課題感など..."
            className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!input.transcript.trim() || !input.research_goal.trim() || isLoading}
          className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
          style={{ background: input.transcript.trim() && !isLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
        >
          {isLoading ? "分析中（1〜2分）..." : "インタビュー分析を実行"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <p className="text-xs text-ink-faint mb-1">調査目的</p>
            <p className="font-semibold text-ink">{result.research_goal}</p>
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
            <div className="space-y-4">
              {result.insights.map((insight, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-900 text-white px-5 py-4">
                    <span className="text-xs text-white/50 font-semibold uppercase tracking-widest block mb-2">Insight {String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm leading-relaxed">{insight.insight_text}</p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-red-500 mb-1.5">葛藤・テンション</p>
                      <p className="text-sm text-ink-muted">{insight.tension}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-emerald-600 mb-1.5">コミュニケーション機会</p>
                      <p className="text-sm text-ink-muted">{insight.opportunity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "patterns" && (
            <div className="space-y-3">
              {result.patterns.map((p, i) => (
                <div key={i} className={`border rounded-2xl p-4 ${PATTERN_STYLE[p.pattern_type] || "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      p.pattern_type === "共通" ? "bg-emerald-200 text-emerald-700" :
                      p.pattern_type === "特異" ? "bg-purple-200 text-purple-700" :
                      "bg-amber-200 text-amber-700"
                    }`}>{p.pattern_type}</span>
                    <p className="font-semibold text-ink">{p.title}</p>
                  </div>
                  <p className="text-sm text-ink-muted mb-3">{p.description}</p>
                  {p.supporting_quotes.length > 0 && (
                    <div className="space-y-1.5">
                      {p.supporting_quotes.map((q, j) => (
                        <p key={j} className="text-xs text-ink bg-white/70 rounded-lg px-3 py-2">「{q}」</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "statements" && (
            <div className="space-y-2">
              {result.key_statements.map((s, i) => {
                const style = TYPE_STYLE[s.type] || { bg: "bg-gray-50", text: "text-ink-muted", label: s.type };
                return (
                  <div key={i} className={`${style.bg} rounded-2xl p-4`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${style.bg} ${style.text} border border-current border-opacity-20`}>{style.label}</span>
                      <div>
                        <p className="text-sm text-ink mb-1.5">「{s.content}」</p>
                        <p className={`text-xs ${style.text}`}>{s.significance}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="space-y-3">
              {result.strategic_directions.map((dir, i) => (
                <div key={i} className="bg-black text-white rounded-2xl p-5">
                  <span className="text-white/40 text-xs font-bold block mb-2">0{i + 1}</span>
                  <p className="text-sm leading-relaxed">{dir}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setResult(null); setInput({ transcript: "", research_goal: "", context: "" }); }}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            新しいインタビューを分析する
          </button>
        </motion.div>
      )}
    </div>
  );
}
