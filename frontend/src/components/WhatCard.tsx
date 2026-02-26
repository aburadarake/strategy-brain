"use client";

import { motion } from "framer-motion";
import { WhatAnalysis } from "@/lib/api";
import { safeStr } from "@/lib/utils";

interface WhatCardProps {
  data: WhatAnalysis;
}

export default function WhatCard({ data }: WhatCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8">

      {/* Core Proposition — hero */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">
          コア・バリュー・プロポジション
        </p>
        <p
          className="font-bold text-ink leading-tight"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", letterSpacing: "-0.02em" }}
        >
          {safeStr(data.value_proposition.core_proposition)}
        </p>
      </section>

      {/* Market Analysis */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          市場環境
        </p>
        <div className="space-y-3">
          {[
            { label: "市場概況",         value: data.market_analysis.market_overview },
            { label: "競合状況",         value: data.market_analysis.competitive_landscape },
            { label: "ポジショニング機会", value: data.market_analysis.positioning_opportunity },
          ].map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-gray-50 rounded-2xl px-5 py-4"
            >
              <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm text-ink leading-snug">{safeStr(value)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Brand Diagnosis */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          ブランド診断
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-ink-faint uppercase tracking-widest mb-3">強み</p>
            <ul className="space-y-2">
              {data.brand_diagnosis.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-ink flex items-start gap-2"
                >
                  <span className="text-ink-muted mt-0.5 shrink-0">+</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-ink-faint uppercase tracking-widest mb-3">弱み</p>
            <ul className="space-y-2">
              {data.brand_diagnosis.weaknesses.map((w, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs text-ink flex items-start gap-2"
                >
                  <span className="text-ink-muted mt-0.5 shrink-0">−</span>
                  {w}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl px-5 py-4">
          <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">認識ギャップ</p>
          <p className="text-sm text-ink">{safeStr(data.brand_diagnosis.perception_gap)}</p>
        </div>
      </section>

      {/* Value Proposition — 3 values */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          価値の三層
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "機能的", value: data.value_proposition.functional_value },
            { label: "情緒的", value: data.value_proposition.emotional_value },
            { label: "社会的", value: data.value_proposition.social_value },
          ].map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-gray-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xs text-ink-faint uppercase tracking-widest mb-2">{label}</p>
              <p className="text-xs text-ink font-medium leading-snug">{safeStr(value)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Differentiation */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          差別化要素
        </p>
        <div className="flex flex-wrap gap-2">
          {data.differentiation.map((d, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-xs text-ink bg-gray-100 px-3 py-1.5 rounded-full font-medium"
            >
              {d}
            </motion.span>
          ))}
        </div>
      </section>
    </div>
  );
}
