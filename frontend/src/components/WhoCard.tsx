"use client";

import { motion } from "framer-motion";
import { WhoAnalysis } from "@/lib/api";

interface WhoCardProps {
  data: WhoAnalysis;
}

export default function WhoCard({ data }: WhoCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8">

      {/* Core Target */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          コアターゲット
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.core_target).map(([key, value], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-gray-50 rounded-2xl p-4"
            >
              <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">{key}</p>
              <p className="text-sm text-ink font-medium">{value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Segments */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          セグメント
        </p>
        <div className="space-y-3">
          {data.segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 ${
                seg.priority === "primary"
                  ? "bg-ink text-white"
                  : "bg-gray-100 text-ink-muted"
              }`}>
                {seg.priority === "primary" ? "PRIMARY" : "SUB"}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{seg.segment_name}</p>
                <p className="text-xs text-ink-muted mt-0.5 leading-snug">{seg.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          消費者インサイト
        </p>
        <div className="space-y-4">
          {data.insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="border-l-2 border-ink pl-5"
            >
              <p className="text-sm font-semibold text-ink leading-snug mb-2">
                &ldquo;{ins.insight}&rdquo;
              </p>
              <div className="space-y-1">
                <p className="text-xs text-ink-muted">
                  <span className="text-ink-faint">Tension —</span> {ins.tension}
                </p>
                <p className="text-xs text-ink-muted">
                  <span className="text-ink-faint">Opportunity —</span> {ins.opportunity}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Unmet Needs */}
      <section>
        <p className="text-xs font-semibold text-ink-faint tracking-widest uppercase mb-4">
          未充足ニーズ
        </p>
        <div className="flex flex-wrap gap-2">
          {data.unmet_needs.map((need, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-xs text-ink bg-gray-100 px-3 py-1.5 rounded-full font-medium"
            >
              {need}
            </motion.span>
          ))}
        </div>
      </section>
    </div>
  );
}
