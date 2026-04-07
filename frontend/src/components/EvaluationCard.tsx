"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, EvaluationInput, EvaluationResult, EvaluationAxisScore } from "@/lib/api";

const AXES = [
  { key: "goal_alignment" as const, label: "目的適合性", en: "Goal Alignment", layer: "engine" },
  { key: "feasibility" as const, label: "実現可能性", en: "Feasibility", layer: "foundation" },
  { key: "competitive_advantage" as const, label: "市場優位性", en: "Competitive Advantage", layer: "engine" },
  { key: "logical_soundness" as const, label: "論理的整合性", en: "Logical Soundness", layer: "foundation" },
  { key: "creative_inspiration" as const, label: "創造的飛躍", en: "Creative Inspiration", layer: "spark" },
];

const LAYER_COLORS = {
  foundation: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
  engine: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
  spark: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-400" },
};

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-sm font-bold text-ink w-8 text-right">{score}/10</span>
    </div>
  );
}

function AxisDetail({ axis, data }: { axis: typeof AXES[0]; data: EvaluationAxisScore }) {
  const [open, setOpen] = useState(false);
  const colors = LAYER_COLORS[axis.layer as keyof typeof LAYER_COLORS];

  return (
    <div className={`rounded-2xl border ${colors.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-4 ${colors.bg} flex items-center justify-between text-left`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${colors.text}`}>{axis.label}</span>
              <span className="text-xs text-ink-faint">{axis.en}</span>
            </div>
            <ScoreBar score={data.score} />
          </div>
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-ink-faint ml-4 flex-shrink-0"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-5 py-4 bg-white space-y-3"
        >
          {data.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">強み</p>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-2">課題</p>
              <ul className="space-y-1">
                {data.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <span className="text-red-400 mt-0.5">△</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.improvement && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-widest mb-1">改善提案</p>
              <p className="text-sm text-ink">{data.improvement}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

interface EvaluationCardProps {
  initialContent?: string;
}

export default function EvaluationCard({ initialContent }: EvaluationCardProps) {
  const [input, setInput] = useState<EvaluationInput>({
    plan_content: initialContent || "",
    context: "",
    balance_priority: "",
  });
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.plan_content.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.evaluate(input);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPct = result ? Math.round((result.total_score / 50) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
              評価する企画の内容
            </label>
            <textarea
              value={input.plan_content}
              onChange={(e) => setInput(prev => ({ ...prev, plan_content: e.target.value }))}
              placeholder="企画書の内容、広告プランのコンセプト、キャンペーン案などを貼り付けてください..."
              rows={8}
              required
              className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
                背景情報（任意）
              </label>
              <textarea
                value={input.context}
                onChange={(e) => setInput(prev => ({ ...prev, context: e.target.value }))}
                placeholder="オリエン情報、ブランド背景など..."
                rows={3}
                className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
                評価スタンス（任意）
              </label>
              <textarea
                value={input.balance_priority}
                onChange={(e) => setInput(prev => ({ ...prev, balance_priority: e.target.value }))}
                placeholder="例: 手堅く実現可能性重視 / とにかく独自性が欲しい..."
                rows={3}
                className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!input.plan_content.trim() || isLoading}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: input.plan_content.trim() && !isLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
          >
            {isLoading ? "評価中..." : "5軸評価を実行"}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Score summary */}
          <div className="bg-black rounded-3xl p-8 text-white">
            <p className="text-xs tracking-widest uppercase text-white/40 mb-4">{result.plan_title}</p>
            <div className="flex items-end gap-4 mb-5">
              <div className="text-7xl font-bold leading-none">{result.total_score}</div>
              <div className="text-white/40 text-lg mb-1">/50</div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Strategic advice — highlighted upfront */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">企画を化けさせる一手</p>
            <p className="text-base font-semibold text-ink leading-relaxed">{result.strategic_advice}</p>
          </div>

          {/* Layer legend */}
          <div className="flex gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-400" />土台（衛生要因）</span>
            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400" />エンジン（戦略的要件）</span>
            <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400" />スパーク（付加価値）</span>
          </div>

          {/* Axes */}
          <div className="space-y-3">
            {AXES.map((axis) => (
              <AxisDetail key={axis.key} axis={axis} data={result[axis.key]} />
            ))}
          </div>

          {/* Layer evaluation */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">レイヤー評価</p>
            <p className="text-sm text-ink leading-relaxed">{result.layer_evaluation}</p>
          </div>

          <button
            onClick={() => setResult(null)}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            別の企画を評価する
          </button>
        </motion.div>
      )}
    </div>
  );
}
