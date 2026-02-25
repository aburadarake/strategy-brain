"use client";

import { motion } from "framer-motion";
import { BigIdea } from "@/lib/api";

interface BigIdeaCardProps {
  data: BigIdea;
}

const criteriaLabels: Record<string, { ja: string; desc: string }> = {
  cognitive_shift:   { ja: "認知転換", desc: "見え方が180度変わるか" },
  brand_exclusivity: { ja: "固有性",   desc: "このブランドだけが言えるか" },
  longevity:         { ja: "持続力",   desc: "5年間コンテンツを生み出せるか" },
  audience_truth:    { ja: "本音代弁", desc: "ターゲットの本音を突いているか" },
  culture_fight:     { ja: "敵の明確さ", desc: "戦う固定観念が見えているか" },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function BigIdeaCard({ data }: BigIdeaCardProps) {
  return (
    <div className="space-y-10">

      {/* ── MAIN IDEA — cinematic full-bleed block ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative bg-ink rounded-3xl overflow-hidden"
        style={{ minHeight: "28rem" }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 80% 70%, white 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full" style={{ minHeight: "28rem" }}>
          {/* Label */}
          <p className="text-xs tracking-widest uppercase text-white/40 font-semibold">
            The Big Idea
          </p>

          {/* The idea itself — huge */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-white font-bold leading-tight mt-8"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            {data.idea}
          </motion.p>

          {/* Rationale */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-white/50 text-sm leading-relaxed mt-8 max-w-2xl"
          >
            {data.rationale}
          </motion.p>
        </div>
      </motion.div>

      {/* ── EVALUATION CRITERIA ── */}
      <motion.div {...fadeUp(0.1)}>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-6">
          5つの評価軸
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {Object.entries(data.evaluation).map(([key, value], i) => {
            const meta = criteriaLabels[key] || { ja: key, desc: "" };
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                className="bg-white border border-gray-100 rounded-2xl p-5"
              >
                {/* Score bar */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        n <= value.score ? "bg-ink" : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-2xl font-bold text-ink tabular-nums">
                  {value.score}
                  <span className="text-sm text-ink-faint font-normal">/5</span>
                </p>
                <p className="text-xs font-semibold text-ink mt-1">{meta.ja}</p>
                <p className="text-xs text-ink-faint mt-0.5">{meta.desc}</p>
                <p className="text-xs text-ink-muted mt-2 leading-snug">{value.reason}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── ALTERNATIVE IDEAS ── */}
      <motion.div {...fadeUp(0.15)}>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-6">
          代替BIG IDEA — 選ばれなかった思想
        </p>
        <div className="space-y-3">
          {data.alternative_ideas.map((alt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="flex items-start gap-5 bg-white border border-gray-100 rounded-2xl px-6 py-5"
            >
              <span className="text-ink-faint text-xs font-semibold tabular-nums shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-ink text-sm leading-relaxed">{alt}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
