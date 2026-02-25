"use client";

import { motion } from "framer-motion";
import { Hosoda3DResult } from "@/lib/api";

interface Props {
  data: Hosoda3DResult;
}

export default function Hosoda3DCard({ data }: Props) {
  const { doubt, discover, design } = data;
  const recommendedIdea = design.ideas[design.recommended_idea] ?? design.ideas[0];

  return (
    <div className="space-y-6">
      {/* DOUBT ─────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-1">
          DOUBT — 疑う
        </p>
        <p className="text-sm text-amber-700 mb-6">
          元の課題：{doubt.original_challenge}
        </p>

        <div className="space-y-4">
          {doubt.questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl bg-white border border-amber-100 p-5"
            >
              {q.angle && (
                <p className="text-xs font-semibold text-amber-500 tracking-widest uppercase mb-2">
                  {q.angle}
                </p>
              )}
              <p className="text-sm font-medium text-ink mb-2">{q.question}</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                💡 {q.insight}
              </p>
            </motion.div>
          ))}
        </div>

        {doubt.hidden_assumptions.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-amber-600 tracking-widest uppercase mb-3">
              隠れた前提・思い込み
            </p>
            <ul className="space-y-1">
              {doubt.hidden_assumptions.map((a, i) => (
                <li key={i} className="text-sm text-amber-800 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">▸</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {doubt.average_answers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-amber-500 tracking-widest uppercase mb-3">
              凡庸な正解（乗り越えるべき答え）
            </p>
            <ul className="space-y-1">
              {doubt.average_answers.map((a, i) => (
                <li key={i} className="text-sm text-amber-600 line-through opacity-70 flex gap-2">
                  <span className="flex-shrink-0 no-underline" style={{ textDecoration: "none" }}>✕</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* DISCOVER ────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-sky-200 bg-sky-50 p-8">
        <p className="text-xs font-semibold tracking-widest text-sky-600 uppercase mb-4">
          DISCOVER — 発見する
        </p>

        <div className="grid grid-cols-1 gap-4">
          {/* Reframing journey */}
          <div className="rounded-2xl bg-white border border-sky-100 p-5">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-3">
              リフレーミングの旅
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 items-start">
                <span className="text-sky-300 font-bold flex-shrink-0">FROM</span>
                <span className="text-ink-muted">{discover.reframing_journey.from}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-sky-500 font-bold flex-shrink-0">TO</span>
                <span className="text-ink font-medium">{discover.reframing_journey.to}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-sky-400 font-bold flex-shrink-0">WHY</span>
                <span className="text-ink-muted">{discover.reframing_journey.because}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-sky-100 p-5">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-2">
              隠れた真実
            </p>
            <p className="text-sm text-ink">{discover.hidden_truth}</p>
          </div>

          <div className="rounded-2xl bg-sky-100 border border-sky-200 p-5">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-widest mb-2">
              解放すべき可能性
            </p>
            <p className="text-sm font-semibold text-sky-800">{discover.possibility_to_unlock}</p>
          </div>
        </div>
      </div>

      {/* DESIGN ─────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-8">
        <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase mb-4">
          DESIGN — デザインする
        </p>

        <div className="space-y-4">
          {design.ideas.map((idea, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`rounded-2xl border p-5 ${
                i === design.recommended_idea
                  ? "bg-violet-100 border-violet-300"
                  : "bg-white border-violet-100"
              }`}
            >
              {i === design.recommended_idea && (
                <span className="inline-block text-xs font-semibold text-violet-600 bg-violet-200 px-3 py-1 rounded-full mb-3">
                  推奨
                </span>
              )}
              <p className="text-sm font-bold text-ink mb-1">{idea.concept}</p>
              <p className="text-xs text-violet-700 mb-2">▸ {idea.enables}</p>
              <p className="text-xs text-ink-muted mb-1">{idea.why_not_average}</p>
              <p className="text-xs text-ink-faint italic">{idea.world_after}</p>
            </motion.div>
          ))}
        </div>

        {design.recommendation_reason && (
          <div className="mt-4 rounded-2xl bg-violet-100 border border-violet-200 p-4">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">
              推奨理由
            </p>
            <p className="text-sm text-violet-800">{design.recommendation_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
