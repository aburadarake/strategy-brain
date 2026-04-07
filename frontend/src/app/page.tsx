"use client";

import { useState } from "react";
import { useStrategy } from "@/hooks/useStrategy";
import BriefInput from "@/components/BriefInput";
import StrategyFlow from "@/components/StrategyFlow";
import EvaluationCard from "@/components/EvaluationCard";
import DeskResearchCard from "@/components/DeskResearchCard";
import SocialListeningCard from "@/components/SocialListeningCard";
import InterviewAnalysisCard from "@/components/InterviewAnalysisCard";
import StrategySynthesisCard from "@/components/StrategySynthesisCard";
import Button from "@/components/ui/Button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";

type Tool = "strategy" | "synthesis" | "evaluate" | "desk-research" | "social-listening" | "interview";

const TOOL_CARDS: {
  id: Tool;
  index: string;
  label: string;
  desc: string;
  detail: string;
}[] = [
  {
    id: "synthesis",
    index: "00",
    label: "戦略フレーム",
    desc: "WHY / WHO / WHAT / HOW",
    detail: "リサーチ・分析結果を4層の戦略フレームに統合。なぜこの戦略が必要か、誰に、何を、どう届けるかを一気通貫で言語化する。",
  },
  {
    id: "evaluate",
    index: "01",
    label: "企画評価",
    desc: "5軸スコアリング",
    detail: "目的適合性・実現可能性・市場優位性・論理的整合性・創造的飛躍の5軸で企画を採点。土台／エンジン／スパークの3層で強度を診断する。",
  },
  {
    id: "desk-research",
    index: "02",
    label: "デスクリサーチ",
    desc: "俯瞰マップ + 深掘り",
    detail: "カテゴリの市場構造・プレイヤーのコミュニケーション・盲点・論点を俯瞰マップ化。気になるポイントを深掘りする2段階リサーチ。",
  },
  {
    id: "social-listening",
    index: "03",
    label: "SNSリスニング",
    desc: "Grokデータからインサイト抽出",
    detail: "SNS投稿データ（Grok等）を貼り付けるだけで、発話パターン・インサイト軸・語られていない空白地帯を構造化。コミュニケーション戦略の方向を示す。",
  },
  {
    id: "interview",
    index: "04",
    label: "インタビュー分析",
    desc: "文字起こしを構造化分析",
    detail: "インタビュー発話録をAIが解析。重要発言・パターン・インサイトを抽出し、葛藤とコミュニケーション機会を言語化する。",
  },
];

export default function Home() {
  const { step, isLoading, startAnalysis, reset, error } = useStrategy();
  const [activeTool, setActiveTool] = useState<Tool>("strategy");

  const showInput = step === "idle";
  const showingResults = !showInput && activeTool === "strategy";

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    if (tool !== "strategy") reset();
  };

  /* ── Results / Tool pages ───────────────────────────────── */
  if (showingResults || activeTool !== "strategy") {
    return (
      <main className="min-h-screen bg-surface">
        {/* Top nav */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(252,252,250,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => { reset(); setActiveTool("strategy"); }}
            className="text-sm font-semibold tracking-widest text-ink-secondary uppercase hover:text-ink transition-colors"
          >
            プ・ランニ・ング伍世
          </button>

          <div className="flex items-center gap-3">
            {/* Tool switcher in results */}
            <div className="hidden md:flex gap-1">
              {TOOL_CARDS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToolChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTool === t.id ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {showingResults && (
              <Button variant="secondary" onClick={() => { reset(); setActiveTool("strategy"); }} disabled={isLoading}>
                新規分析
              </Button>
            )}
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
          <AnimatePresence mode="wait">
            {showingResults ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <ErrorBoundary><StrategyFlow /></ErrorBoundary>
              </motion.div>
            ) : (
              <motion.div key={activeTool} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="max-w-2xl mx-auto">
                  {/* Tool header */}
                  <div className="mb-8">
                    <p className="text-xs text-ink-faint tracking-widest uppercase mb-1">
                      {TOOL_CARDS.find(t => t.id === activeTool)?.index}
                    </p>
                    <h1 className="text-3xl font-bold text-ink tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                      {TOOL_CARDS.find(t => t.id === activeTool)?.label}
                    </h1>
                    <p className="text-ink-muted text-sm mt-1">
                      {TOOL_CARDS.find(t => t.id === activeTool)?.desc}
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl shadow-[0_2px_40px_rgba(0,0,0,0.08)] p-8">
                    <ErrorBoundary>
                      {activeTool === "synthesis" && <StrategySynthesisCard />}
                      {activeTool === "evaluate" && <EvaluationCard />}
                      {activeTool === "desk-research" && <DeskResearchCard />}
                      {activeTool === "social-listening" && <SocialListeningCard />}
                      {activeTool === "interview" && <InterviewAnalysisCard />}
                    </ErrorBoundary>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    );
  }

  /* ── Landing page ───────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      {/* Hero + form */}
      <BriefInput onSubmit={startAnalysis} isLoading={isLoading} />

      {/* ── Tool showcase ──────────────────────────────────── */}
      <section className="border-t border-white/15 px-6 pb-24">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-16 border-b border-white/15 mb-12"
          >
            <p className="text-white/45 text-xs tracking-[0.25em] uppercase mb-3">スタンドアロン・ツール</p>
            <h2
              className="font-bold text-white"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              戦略思考を、パーツ単位で。
            </h2>
          </motion.div>

          {/* Tool cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOL_CARDS.map((tool, i) => (
              <motion.button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 rounded-3xl p-7 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-white/40 text-xs font-bold tracking-widest">{tool.index}</span>
                  <svg
                    className="w-4 h-4 text-white/35 group-hover:text-white/70 transition-colors"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>

                <h3
                  className="font-bold text-white mb-1 group-hover:text-white transition-colors"
                  style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
                >
                  {tool.label}
                </h3>
                <p className="text-white/50 text-xs font-medium tracking-wide mb-4">{tool.desc}</p>
                <p className="text-white/55 text-sm leading-relaxed group-hover:text-white/75 transition-colors">
                  {tool.detail}
                </p>
              </motion.button>
            ))}

            {/* Strategy analysis card (main) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: TOOL_CARDS.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/[0.04] border border-white/15 rounded-3xl p-7"
            >
              <span className="text-white/40 text-xs font-bold tracking-widest block mb-6">FULL</span>
              <h3 className="font-bold text-white mb-1" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
                戦略立案（フルコース）
              </h3>
              <p className="text-white/50 text-xs font-medium tracking-wide mb-4">WHO / WHAT / BIG IDEA / コピー / 広告企画</p>
              <p className="text-white/55 text-sm leading-relaxed">
                デスクリサーチ → インタビュー分析 → 障壁分析 → WHO/WHAT → BIG IDEA → コピーライティング → 広告企画6案まで、全モジュールを一気通貫で実行。PDFをアップロードするほど分析精度が上がる。
              </p>
              <p className="text-white/35 text-xs mt-4 pt-4 border-t border-white/15">↑ 上のフォームから開始</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/15 px-6 py-8 text-center">
        <p className="text-white/25 text-xs tracking-[0.3em] uppercase">
          プ・ランニ・ング伍世
        </p>
      </footer>
    </main>
  );
}
