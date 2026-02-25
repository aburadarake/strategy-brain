"use client";

import { useStrategy } from "@/hooks/useStrategy";
import BriefInput from "@/components/BriefInput";
import StrategyFlow from "@/components/StrategyFlow";
import Button from "@/components/ui/Button";
import ErrorBoundary from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { step, isLoading, startAnalysis, reset, error } = useStrategy();
  const showInput = step === "idle";

  return (
    <main className="min-h-screen bg-surface">
      {/* Top nav bar — only shown during results */}
      <AnimatePresence>
        {!showInput && (
          <motion.header
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
            style={{ background: "rgba(252,252,250,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <span className="text-sm font-semibold tracking-widest text-ink-secondary uppercase">
                プランニ・ング四世
              </span>
            </div>
            <Button variant="secondary" onClick={reset} disabled={isLoading}>
              新規分析
            </Button>
          </motion.header>
        )}
      </AnimatePresence>

      <div className={`max-w-7xl mx-auto px-6 ${!showInput ? "pt-24 pb-32" : "py-0"}`}>
        <AnimatePresence mode="wait">
          {showInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <BriefInput onSubmit={startAnalysis} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ErrorBoundary>
                <StrategyFlow />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {showInput && (
        <footer className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-ink-faint tracking-widest uppercase">
            プランニ・ング四世
          </p>
        </footer>
      )}
    </main>
  );
}
