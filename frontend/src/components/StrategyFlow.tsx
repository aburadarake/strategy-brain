"use client";

import { motion } from "framer-motion";
import MermaidDiagram from "./MermaidDiagram";
import WhoCard from "./WhoCard";
import WhatCard from "./WhatCard";
import BigIdeaCard from "./BigIdeaCard";
import CopyOutput from "./CopyOutput";
import AdPlanningCard from "./AdPlanningCard";
import Hosoda3DCard from "./Hosoda3DCard";
import { useStrategyStore } from "@/hooks/useStrategy";

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
  const { step, isLoading, statusMessage, hosoda3d, barriers, who, what, bigIdea, copy, adPlanning, error } = useStrategyStore();

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
        {/* Big loading message */}
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

        {/* Step progress */}
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

  /* ── Results ────────────────────────────── */
  return (
    <div className="space-y-24">

      {/* ── SECTION LABEL helper ── */}

      {/* Barrier Analysis */}
      {barriers && (
        <motion.section {...fadeUp(0.0)}>
          <SectionLabel index="01" title="障壁分析" subtitle="使わない理由30項目と因果構造" />
          <div className="mt-10 space-y-8">
            {/* ABC counts */}
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

            {/* Key barriers */}
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

            {/* Diagram */}
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

      {/* ── 細田式3Dモデル（別視点分析）────────────────────────── */}
      {hosoda3d && (
        <motion.section {...fadeUp(0.05)}>
          {/* 区切り線 + 別分析ラベル */}
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
