"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, StrategySynthesisInput, StrategySynthesisResult, WhyFrame, WhoFrame, WhatFrame, HowFrame } from "@/lib/api";

interface FrameBlockProps {
  label: string;
  color: { bg: string; border: string; badge: string; badgeText: string; accent: string };
  statement: string;
  details: { label: string; value: string }[];
  extra?: React.ReactNode;
  delay?: number;
}

function FrameBlock({ label, color, statement, details, extra, delay = 0 }: FrameBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-3xl border ${color.bg} ${color.border} overflow-hidden`}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start gap-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${color.badge} ${color.badgeText} tracking-widest flex-shrink-0 mt-0.5`}>
          {label}
        </span>
        <p className={`text-base font-bold leading-snug ${color.accent}`}>{statement}</p>
      </div>
      {/* Details */}
      <div className="px-6 pb-5 space-y-3 border-t border-white/60 pt-4">
        {details.map((d, i) => (
          <div key={i}>
            <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-1">{d.label}</p>
            <p className="text-sm text-ink leading-relaxed">{d.value}</p>
          </div>
        ))}
        {extra}
      </div>
    </motion.div>
  );
}

interface StrategySynthesisCardProps {
  /** 既存の分析結果から自動入力する場合に指定 */
  prefill?: Partial<StrategySynthesisInput>;
}

export default function StrategySynthesisCard({ prefill }: StrategySynthesisCardProps) {
  const [input, setInput] = useState<StrategySynthesisInput>({
    product_name: prefill?.product_name ?? "",
    research_findings: prefill?.research_findings ?? "",
    who_insights: prefill?.who_insights ?? "",
    what_insights: prefill?.what_insights ?? "",
    how_insights: prefill?.how_insights ?? "",
    additional_context: prefill?.additional_context ?? "",
  });
  const [result, setResult] = useState<StrategySynthesisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = input.product_name.trim() &&
    (input.research_findings?.trim() || input.who_insights?.trim() ||
     input.what_insights?.trim() || input.how_insights?.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.strategySynthesis(input);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const FRAMES: { key: keyof StrategySynthesisResult; label: string; color: FrameBlockProps["color"]; getDetails: (r: StrategySynthesisResult) => { label: string; value: string }[]; getExtra?: (r: StrategySynthesisResult) => React.ReactNode }[] = [
    {
      key: "why",
      label: "WHY",
      color: { bg: "bg-violet-50", border: "border-violet-100", badge: "bg-violet-100", badgeText: "text-violet-700", accent: "text-violet-900" },
      getDetails: (r) => [
        { label: "消費者の葛藤", value: (r.why as WhyFrame).core_tension },
        { label: "社会・文化的文脈", value: (r.why as WhyFrame).cultural_context },
        { label: "ブランドの必然性", value: (r.why as WhyFrame).brand_opportunity },
      ],
    },
    {
      key: "who",
      label: "WHO",
      color: { bg: "bg-blue-50", border: "border-blue-100", badge: "bg-blue-100", badgeText: "text-blue-700", accent: "text-blue-900" },
      getDetails: (r) => [
        { label: "ターゲット像", value: (r.who as WhoFrame).primary_target },
        { label: "心理・世界観", value: (r.who as WhoFrame).mindset },
        { label: "本質的な葛藤", value: (r.who as WhoFrame).key_tension },
      ],
    },
    {
      key: "what",
      label: "WHAT",
      color: { bg: "bg-emerald-50", border: "border-emerald-100", badge: "bg-emerald-100", badgeText: "text-emerald-700", accent: "text-emerald-900" },
      getDetails: (r) => [
        { label: "核心メッセージ", value: (r.what as WhatFrame).core_message },
        { label: "ブランドの役割", value: (r.what as WhatFrame).brand_role },
        { label: "価値の約束", value: (r.what as WhatFrame).value_promise },
      ],
    },
    {
      key: "how",
      label: "HOW",
      color: { bg: "bg-amber-50", border: "border-amber-100", badge: "bg-amber-100", badgeText: "text-amber-700", accent: "text-amber-900" },
      getDetails: (r) => [
        { label: "コミュニケーションアプローチ", value: (r.how as HowFrame).communication_approach },
        { label: "トーン＆マナー", value: (r.how as HowFrame).tone_manner },
      ],
      getExtra: (r) => (
        <div>
          <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">具体的施策</p>
          <div className="space-y-1.5">
            {(r.how as HowFrame).key_tactics.map((t, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-4 h-4 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-ink">{t}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Input form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
              製品・サービス名
            </label>
            <input
              type="text"
              value={input.product_name}
              onChange={(e) => setInput(prev => ({ ...prev, product_name: e.target.value }))}
              placeholder="例: ○○ウイスキー、△△アプリ..."
              required
              className="w-full text-lg font-semibold text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
              リサーチ結果（デスクリサーチ・SNSリスニング・インタビューなど）
            </label>
            <textarea
              value={input.research_findings}
              onChange={(e) => setInput(prev => ({ ...prev, research_findings: e.target.value }))}
              placeholder="市場調査、SNS分析、インタビュー分析の結果をまとめて貼り付けてください..."
              rows={4}
              className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-5 py-4 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
                WHO分析・ターゲットインサイト（任意）
              </label>
              <textarea
                value={input.who_insights}
                onChange={(e) => setInput(prev => ({ ...prev, who_insights: e.target.value }))}
                placeholder="ターゲット像、消費者インサイト、未充足ニーズなど..."
                rows={3}
                className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
                WHAT分析・価値提案・BIG IDEA（任意）
              </label>
              <textarea
                value={input.what_insights}
                onChange={(e) => setInput(prev => ({ ...prev, what_insights: e.target.value }))}
                placeholder="BIG IDEA、価値提案、ブランドの差別化要素など..."
                rows={3}
                className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">
                HOW分析・広告企画（任意）
              </label>
              <textarea
                value={input.how_insights}
                onChange={(e) => setInput(prev => ({ ...prev, how_insights: e.target.value }))}
                placeholder="広告企画案、コピー、コミュニケーション施策など..."
                rows={3}
                className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
            style={{ background: canSubmit && !isLoading ? "#0a0a0a" : "#d1d1d1", color: "white" }}
          >
            {isLoading ? "戦略フレームを生成中（1〜2分）..." : "WHY / WHO / WHAT / HOW を生成"}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-black rounded-3xl p-8"
          >
            <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">{result.product_name}</p>
            <p
              className="text-white font-bold leading-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
            >
              {result.strategy_headline}
            </p>
          </motion.div>

          {/* 4 frames */}
          <div className="space-y-4">
            {FRAMES.map((f, i) => {
              const frameData = result[f.key];
              if (!frameData || typeof frameData !== "object") return null;
              const statement = (frameData as { statement: string }).statement;
              return (
                <FrameBlock
                  key={f.key}
                  label={f.label}
                  color={f.color}
                  statement={statement}
                  details={f.getDetails(result)}
                  extra={f.getExtra?.(result)}
                  delay={0.1 + i * 0.08}
                />
              );
            })}
          </div>

          {/* Strategy statement */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gray-50 rounded-3xl p-6"
          >
            <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">戦略ステートメント</p>
            <p className="text-ink leading-relaxed whitespace-pre-line">{result.strategy_statement}</p>
          </motion.div>

          <button
            onClick={() => { setResult(null); setInput({ product_name: "", research_findings: "", who_insights: "", what_insights: "", how_insights: "", additional_context: "" }); }}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            新しい戦略を生成する
          </button>
        </motion.div>
      )}
    </div>
  );
}
