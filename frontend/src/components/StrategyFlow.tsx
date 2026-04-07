"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MermaidDiagram from "./MermaidDiagram";
import WhoCard from "./WhoCard";
import WhatCard from "./WhatCard";
import BigIdeaCard from "./BigIdeaCard";
import CopyOutput from "./CopyOutput";
import AdPlanningCard from "./AdPlanningCard";
import Hosoda3DCard from "./Hosoda3DCard";
import { useStrategyStore } from "@/hooks/useStrategy";
import { api, StrategySynthesisResult, WhyFrame, WhoFrame, WhatFrame, HowFrame } from "@/lib/api";
import { safeStr } from "@/lib/utils";

const STEPS = [
  { id: "barriers", label: "障壁分析" },
  { id: "who_what", label: "WHO / WHAT" },
  { id: "bigidea",  label: "BIG IDEA" },
  { id: "copy",     label: "コピー" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function StrategyFlow() {
  const { step, isLoading, statusMessage, hosoda3d, barriers, who, what, bigIdea, copy, adPlanning, brief, error } = useStrategyStore();
  const [synthesis, setSynthesis] = useState<StrategySynthesisResult | null>(null);
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState<string | null>(null);

  if (step === "idle") return null;

  /* ── Error ─────────────────────────────── */
  if (error) {
    return (
      <motion.div {...fadeUp()} className="max-w-2xl mx-auto py-32 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ink mb-3">エラーが発生しました</h3>
        <p className="text-ink-muted">{error}</p>
      </motion.div>
    );
  }

  /* ── Loading ────────────────────────────── */
  if (isLoading) {
    const currentIdx = STEPS.findIndex((s) => s.id === step);
    return (
      <motion.div {...fadeUp()} className="max-w-2xl mx-auto py-32">
        <div className="text-center mb-20">
          <p className="text-ink-muted text-xs tracking-widest uppercase mb-6">分析中</p>
          <motion.p
            key={statusMessage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-semibold text-ink"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.02em" }}
          >
            {statusMessage || "思考中..."}
          </motion.p>
        </div>

        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => {
            const done = currentIdx > i;
            const active = currentIdx === i;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                      done   ? "bg-ink text-white"
                    : active ? "bg-ink text-white animate-pulse-soft"
                    :          "bg-gray-100 text-ink-faint"
                    }`}
                  >
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${active ? "text-ink font-medium" : "text-ink-faint"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-px mx-2 mb-5 transition-all duration-500 ${done ? "bg-ink" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  /* ── Synthesis handler ──────────────────── */
  const handleGenerateSynthesis = async () => {
    if (!who || !what || !bigIdea) return;
    setSynthLoading(true);
    setSynthError(null);

    const whoText = [
      who.segments.length > 0 ? `主要ターゲット: ${who.segments[0]?.segment_name}` : "",
      who.insights.length > 0 ? `コアインサイト: ${safeStr(who.insights[0]?.insight)}` : "",
      who.unmet_needs.length > 0 ? `未充足ニーズ: ${who.unmet_needs.slice(0, 3).map(safeStr).join(" / ")}` : "",
    ].filter(Boolean).join("\n");

    const whatText = [
      `BIG IDEA: ${safeStr(bigIdea.idea)}`,
      `コアバリュープロポジション: ${safeStr(what.value_proposition.core_proposition)}`,
      `差別化要素: ${what.differentiation.slice(0, 3).map(safeStr).join(" / ")}`,
    ].filter(Boolean).join("\n");

    try {
      const res = await api.strategySynthesis({
        product_name: brief?.product_name ?? "",
        who_insights: whoText,
        what_insights: whatText,
      });
      setSynthesis(res);
    } catch (e) {
      setSynthError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSynthLoading(false);
    }
  };

  /* ── Results ────────────────────────────── */
  return (
    <div className="space-y-24">

      {/* ── STRATEGY OVERVIEW — hero summary when complete ── */}
      {step === "complete" && bigIdea && (
        <motion.section {...fadeUp(0.0)}>
          <div className="bg-black rounded-3xl overflow-hidden">
            <div className="p-10 md:p-14">
              <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-6">
                {brief?.product_name}
              </p>
              <p
                className="text-white font-bold leading-tight mb-8"
                style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
              >
                {safeStr(bigIdea.idea)}
              </p>
              {who && who.insights.length > 0 && (
                <div className="border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-2">コアインサイト</p>
                    <p className="text-white/70 text-sm leading-relaxed">&ldquo;{safeStr(who.insights[0].insight)}&rdquo;</p>
                  </div>
                  {what && (
                    <div>
                      <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-2">バリュープロポジション</p>
                      <p className="text-white/70 text-sm leading-relaxed">{safeStr(what.value_proposition.core_proposition)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Barrier Analysis */}
      {barriers && (
        <motion.section {...fadeUp(0.0)}>
          <SectionLabel index="01" title="障壁分析" subtitle="使わない理由30項目と因果構造" />
          <div className="mt-10 space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "A — プロダクト解決", count: barriers.classification.a_items.length, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
                { label: "B — コミュニケーション解決", count: barriers.classification.b_items.length, color: "bg-amber-50 border-amber-100", text: "text-amber-700" },
                { label: "C — 文化・社会変容", count: barriers.classification.c_items.length, color: "bg-violet-50 border-violet-100", text: "text-violet-700" },
              ].map(({ label, count, color, text }) => (
                <div key={label} className={`rounded-3xl p-8 border ${color}`}>
                  <p className={`text-5xl font-bold mb-2 ${text}`}>{count}</p>
                  <p className={`text-sm font-medium ${text}`}>{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">急所 — つながりが多い障壁</p>
              <div className="flex flex-wrap gap-3">
                {barriers.causality.key_barriers.map((id) => {
                  const b = barriers.barriers.barriers.find((x) => x.id === id);
                  return b ? (
                    <motion.span
                      key={id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="bg-ink text-white px-5 py-2 rounded-full text-sm font-medium"
                    >
                      {b.barrier.substring(0, 40)}
                      {b.barrier.length > 40 ? "…" : ""}
                    </motion.span>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">因果関係図</p>
              <MermaidDiagram chart={barriers.mermaid_diagram} />
            </div>
          </div>
        </motion.section>
      )}

      {/* WHO & WHAT */}
      {(who || what) && (
        <motion.section {...fadeUp(0.05)}>
          <SectionLabel index="02" title="WHO / WHAT" subtitle="ターゲットの深層と市場の白地" />
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {who && <WhoCard data={who} />}
            {what && <WhatCard data={what} />}
          </div>
        </motion.section>
      )}

      {/* BIG IDEA */}
      {bigIdea && (
        <motion.section {...fadeUp(0.05)}>
          <SectionLabel index="03" title="BIG IDEA" subtitle="世界の見え方を変える一つの思想" />
          <div className="mt-10">
            <BigIdeaCard data={bigIdea} />
          </div>
        </motion.section>
      )}

      {/* Copywriting */}
      {copy && (
        <motion.section {...fadeUp(0.05)}>
          <SectionLabel index="04" title="コピーライティング" subtitle="4つの感情レバーによる10本" />
          <div className="mt-10">
            <CopyOutput data={copy} />
          </div>
        </motion.section>
      )}

      {/* Ad Planning */}
      {adPlanning && (
        <motion.section {...fadeUp(0.05)}>
          <SectionLabel index="05" title="広告企画" subtitle="6つの発想法による統合プラン" />
          <div className="mt-10">
            <AdPlanningCard data={adPlanning} />
          </div>
        </motion.section>
      )}

      {/* ── WHY/WHO/WHAT/HOW 戦略フレーム ─────────────────────────── */}
      {step === "complete" && who && what && bigIdea && (
        <motion.section {...fadeUp(0.05)}>
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-ink-faint tracking-widest uppercase whitespace-nowrap">
              戦略フレーム
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {!synthesis && !synthLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-gray-50 rounded-3xl"
            >
              <p
                className="font-bold text-ink mb-2"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}
              >
                WHY / WHO / WHAT / HOW
              </p>
              <p className="text-ink-muted text-sm mb-8">分析結果を統合して、4層の戦略フレームを生成します</p>
              <button
                onClick={handleGenerateSynthesis}
                className="px-8 py-3.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                戦略フレームを生成
              </button>
              {synthError && <p className="text-sm text-red-500 mt-4">{synthError}</p>}
            </motion.div>
          )}

          {synthLoading && (
            <div className="text-center py-16 bg-gray-50 rounded-3xl">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-ink font-medium"
              >
                戦略フレームを生成中...
              </motion.div>
            </div>
          )}

          {synthesis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              {/* Headline */}
              <div className="bg-black rounded-3xl p-8 md:p-10">
                <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">戦略ヘッドライン</p>
                <p
                  className="text-white font-bold leading-tight"
                  style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
                >
                  {synthesis.strategy_headline}
                </p>
              </div>

              {/* 4 frames */}
              {(
                [
                  { key: "why" as const, label: "WHY", bg: "bg-violet-50", border: "border-violet-100", badge: "bg-violet-100 text-violet-700", accent: "text-violet-900" },
                  { key: "who" as const, label: "WHO", bg: "bg-blue-50", border: "border-blue-100", badge: "bg-blue-100 text-blue-700", accent: "text-blue-900" },
                  { key: "what" as const, label: "WHAT", bg: "bg-emerald-50", border: "border-emerald-100", badge: "bg-emerald-100 text-emerald-700", accent: "text-emerald-900" },
                  { key: "how" as const, label: "HOW", bg: "bg-amber-50", border: "border-amber-100", badge: "bg-amber-100 text-amber-700", accent: "text-amber-900" },
                ] as const
              ).map((f, i) => {
                const frame = synthesis[f.key];
                const statement = (frame as { statement: string }).statement;
                return (
                  <motion.div
                    key={f.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                    className={`rounded-3xl border ${f.bg} ${f.border} overflow-hidden`}
                  >
                    <div className="px-6 pt-5 pb-4 flex items-start gap-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${f.badge} tracking-widest flex-shrink-0 mt-0.5`}>
                        {f.label}
                      </span>
                      <p className={`text-base font-bold leading-snug ${f.accent}`}>{statement}</p>
                    </div>
                    <div className="px-6 pb-5 pt-4 border-t border-white/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {f.key === "why" && (
                        <>
                          <Detail label="消費者の葛藤" value={(frame as WhyFrame).core_tension} />
                          <Detail label="社会・文化的文脈" value={(frame as WhyFrame).cultural_context} />
                          <Detail label="ブランドの必然性" value={(frame as WhyFrame).brand_opportunity} />
                        </>
                      )}
                      {f.key === "who" && (
                        <>
                          <Detail label="ターゲット像" value={(frame as WhoFrame).primary_target} />
                          <Detail label="心理・世界観" value={(frame as WhoFrame).mindset} />
                          <Detail label="本質的な葛藤" value={(frame as WhoFrame).key_tension} />
                        </>
                      )}
                      {f.key === "what" && (
                        <>
                          <Detail label="核心メッセージ" value={(frame as WhatFrame).core_message} />
                          <Detail label="ブランドの役割" value={(frame as WhatFrame).brand_role} />
                          <Detail label="価値の約束" value={(frame as WhatFrame).value_promise} />
                        </>
                      )}
                      {f.key === "how" && (
                        <>
                          <Detail label="アプローチ" value={(frame as HowFrame).communication_approach} />
                          <Detail label="トーン＆マナー" value={(frame as HowFrame).tone_manner} />
                          <div>
                            <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">具体的施策</p>
                            <ul className="space-y-1.5">
                              {(frame as HowFrame).key_tactics.map((t, j) => (
                                <li key={j} className="flex gap-2 items-start">
                                  <span className="text-xs text-ink-faint shrink-0 mt-0.5">{j + 1}.</span>
                                  <p className="text-sm text-ink">{t}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Strategy statement */}
              <div className="bg-gray-50 rounded-3xl p-6">
                <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">戦略ステートメント</p>
                <p className="text-ink leading-relaxed whitespace-pre-line text-sm">{synthesis.strategy_statement}</p>
              </div>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* ── 細田式3Dモデル（別視点分析）────────────────────────── */}
      {hosoda3d && (
        <motion.section {...fadeUp(0.05)}>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-amber-200" />
            <span className="text-xs font-semibold text-amber-500 tracking-widest uppercase whitespace-nowrap">
              別視点の可能性
            </span>
            <div className="flex-1 h-px bg-amber-200" />
          </div>

          <div className="flex items-end gap-6 pb-6 border-b border-amber-100 mb-10">
            <span className="text-amber-300 text-sm font-semibold tracking-widest">Alt</span>
            <div>
              <h2
                className="font-bold text-ink leading-none"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.025em" }}
              >
                細田式 3D モデル
              </h2>
              <p className="text-amber-600 text-sm mt-1">
                Doubt / Discover / Design — 本筋フローとは独立した代替視点
              </p>
            </div>
          </div>

          <div>
            <Hosoda3DCard data={hosoda3d} />
          </div>
        </motion.section>
      )}
    </div>
  );
}

function SectionLabel({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-end gap-6 pb-6 border-b border-gray-100">
      <span className="text-ink-faint text-sm font-semibold tracking-widest">{index}</span>
      <div>
        <h2
          className="font-bold text-ink leading-none"
          style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", letterSpacing: "-0.025em" }}
        >
          {title}
        </h2>
        <p className="text-ink-muted text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-1">{label}</p>
      <p className="text-sm text-ink leading-relaxed">{value}</p>
    </div>
  );
}
