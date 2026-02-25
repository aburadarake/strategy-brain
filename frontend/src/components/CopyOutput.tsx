"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CopyOutput as CopyOutputType } from "@/lib/api";

interface CopyOutputProps {
  data: CopyOutputType;
}

const LEVER_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "本音":  { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  label: "本音 — Raw Truth" },
  "共感":  { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   label: "共感 — Deep Empathy" },
  "反感":  { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    label: "反感 — Provocation" },
  "驚き":  { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", label: "驚き — Unexpected Reframe" },
};

function getLeverMeta(angle: string) {
  for (const key of Object.keys(LEVER_META)) {
    if (angle.includes(key)) return LEVER_META[key];
  }
  return { color: "text-ink-muted", bg: "bg-gray-50", border: "border-gray-200", label: angle };
}

export default function CopyOutput({ data }: CopyOutputProps) {
  const [selectedIndex, setSelectedIndex] = useState(data.recommended ?? 0);

  return (
    <div className="space-y-10">

      {/* ── STRATEGIC BRIEF ── */}
      <div>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-6">
          戦略ブリーフ
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(data.strategic_brief).map(([key, value]) => (
            <div key={key} className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs text-ink-faint uppercase tracking-widest mb-2">{key}</p>
              <p className="text-sm text-ink leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── COPY SELECTOR ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase">
            10本のコピー
          </p>
          <p className="text-xs text-ink-faint">
            推奨: #{(data.recommended ?? 0) + 1}
          </p>
        </div>

        {/* Pill tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {data.variations.map((v, i) => {
            const meta = getLeverMeta(v.angle);
            const isSelected = selectedIndex === i;
            const isRecommended = i === (data.recommended ?? 0);
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  isSelected
                    ? "bg-ink text-white border-ink"
                    : isRecommended
                    ? `${meta.bg} ${meta.color} ${meta.border}`
                    : "bg-white text-ink-muted border-gray-200 hover:border-gray-300"
                }`}
              >
                #{i + 1}
                {isRecommended && !isSelected && " ★"}
              </button>
            );
          })}
        </div>

        {/* Selected copy detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {(() => {
              const v = data.variations[selectedIndex];
              const meta = getLeverMeta(v.angle);
              const isRecommended = selectedIndex === (data.recommended ?? 0);
              return (
                <div className={`rounded-3xl p-8 border ${meta.bg} ${meta.border}`}>
                  {/* Lever badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                      {meta.label}
                    </span>
                    {isRecommended && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ink text-white">
                        推奨
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <p
                    className="font-bold text-ink leading-tight mb-3"
                    style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}
                  >
                    {v.headline}
                  </p>

                  {/* Subhead */}
                  {v.subhead && (
                    <p className="text-ink-muted text-lg mb-4">{v.subhead}</p>
                  )}

                  {/* Body */}
                  {v.body && (
                    <p className="text-ink-muted text-sm leading-relaxed mb-6 whitespace-pre-line">
                      {v.body}
                    </p>
                  )}

                  {/* Why it works */}
                  {v.why_it_works && (
                    <div className="mt-4 pt-4 border-t border-black/10">
                      <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">なぜ刺さるか</p>
                      <p className="text-sm text-ink-muted">{v.why_it_works}</p>
                    </div>
                  )}

                  {/* Technique */}
                  <div className="mt-4 flex gap-2">
                    <span className="text-xs bg-white/60 text-ink-muted px-3 py-1 rounded-full border border-black/10">
                      {v.technique}
                    </span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Recommendation reason */}
        {data.recommendation_reason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4"
          >
            <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">推奨理由</p>
            <p className="text-sm text-ink-muted">{data.recommendation_reason}</p>
          </motion.div>
        )}
      </div>

      {/* ── ALL COPIES GRID ── */}
      <div>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-6">
          全コピー — 感情レバー別
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.variations.map((v, i) => {
            const meta = getLeverMeta(v.angle);
            const isSelected = selectedIndex === i;
            const isRecommended = i === (data.recommended ?? 0);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedIndex(i)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-ink bg-white shadow-[0_2px_16px_rgba(0,0,0,0.08)]"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${meta.bg} ${meta.color} border ${meta.border}`}>
                    {v.angle.substring(0, 4)}
                  </span>
                  <span className="text-xs text-ink-faint shrink-0">
                    #{i + 1}{isRecommended ? " ★" : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">
                  {v.headline}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
