"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BriefInput as BriefInputType } from "@/lib/api";
import PolyhedronCanvas from "@/components/PolyhedronCanvas";

interface BriefInputProps {
  onSubmit: (brief: BriefInputType, files?: File[]) => void;
  isLoading?: boolean;
}

const SUPPORTED_FILE_TYPES = [".pdf",".docx",".doc",".xlsx",".xls",".txt",".md",".csv",".json"];

const STRATEGY_QUESTIONS = [
  {
    id: "barrier",
    label: "01 / 購買障壁",
    question: "この商材を使わない・選ばない一番の理由は何だと思いますか？",
    placeholder: "例：使い方がわからない、効果を信じていない、競合の方が有名、など",
    required: true,
  },
  {
    id: "differentiation",
    label: "02 / 独自性",
    question: "競合と比べた最大の強み・独自性は何ですか？",
    placeholder: "例：ADフィルムという特許技術、話しながら使える、眠くなる成分なし、など",
    required: true,
  },
  {
    id: "target",
    label: "03 / ターゲット",
    question: "最も獲得したいユーザー層と、現在の主要ユーザーを教えてください",
    placeholder: "例：獲得したい→25-44歳有職女性 / 現在→40-60代女性、など",
    required: true,
  },
  {
    id: "objective",
    label: "04 / キャンペーン目的",
    question: "このキャンペーンで一番変えたいことは何ですか？",
    placeholder: "例：製品の独自性を知ってもらう、購買転換率を上げる、ブランドイメージを刷新、など",
    required: true,
  },
  {
    id: "constraints",
    label: "05 / 制約・NG",
    question: "NGワード・必須メッセージ・薬事/業界規制など、制約があれば教えてください（任意）",
    placeholder: "例：「治る」「完治」は使用不可、医薬品なので効能効果の範囲内のみ、など",
    required: false,
  },
];

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  questionIndex?: number;
}

type UIStep = "brief" | "chat";

export default function BriefInput({ onSubmit, isLoading }: BriefInputProps) {
  const [uiStep, setUiStep] = useState<UIStep>("brief");
  const [brief, setBrief] = useState<BriefInputType>({
    product_name: "",
    product_description: "",
    target_market: "",
    current_situation: "",
    objectives: "",
    competitors: "",
    additional_info: "",
  });
  const [showDescription, setShowDescription] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatDone, setChatDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.product_name) return;
    // Initialize chat with first question
    setChatMessages([
      {
        role: "assistant",
        content: STRATEGY_QUESTIONS[0].question,
        questionIndex: 0,
      },
    ]);
    setCurrentQuestionIndex(0);
    setUiStep("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleChatSubmit = () => {
    const trimmed = currentInput.trim();
    const q = STRATEGY_QUESTIONS[currentQuestionIndex];

    // Required check
    if (!trimmed && q.required) return;

    // Add user message
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: trimmed || "（スキップ）" },
    ];

    // Save answer
    if (trimmed) {
      setAnswers((prev) => ({ ...prev, [q.id]: trimmed }));
    }

    setCurrentInput("");

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < STRATEGY_QUESTIONS.length) {
      // Add next question after a brief delay
      setTimeout(() => {
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            content: STRATEGY_QUESTIONS[nextIndex].question,
            questionIndex: nextIndex,
          },
        ]);
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 300);
    } else {
      // All done
      setTimeout(() => {
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `ありがとうございます。${brief.product_name}の戦略分析を開始します。`,
          },
        ]);
        setChatDone(true);
      }, 300);
    }

    setChatMessages(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const handleSubmit = () => {
    const qaContext = STRATEGY_QUESTIONS
      .filter((q) => answers[q.id]?.trim())
      .map((q) => `【${q.label}】${q.question}\n→ ${answers[q.id].trim()}`)
      .join("\n\n");

    const enrichedBrief: BriefInputType = {
      ...brief,
      additional_info: [brief.additional_info, qaContext].filter(Boolean).join("\n\n"),
    };

    onSubmit(enrichedBrief, files);
  };

  const updateField = (field: keyof BriefInputType, value: string) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles).filter((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      return SUPPORTED_FILE_TYPES.includes(ext);
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const canNext = !!brief.product_name && !isLoading;

  const currentQ = STRATEGY_QUESTIONS[currentQuestionIndex];
  const canSend = !chatDone && (currentInput.trim() || !currentQ?.required);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">

      {/* 3D Polyhedron */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
        style={{ filter: "drop-shadow(0 0 40px rgba(255,255,255,0.08))" }}
      >
        <PolyhedronCanvas size={240} />
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="text-white/45 text-xs tracking-[0.3em] uppercase mb-6"
      >
        戦略の深層を、言葉に変える。
      </motion.p>

      {/* Hero */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="font-bold text-white text-center mb-16 tracking-tight"
        style={{ fontSize: "clamp(3.2rem, 9vw, 7rem)", lineHeight: 1.0, letterSpacing: "-0.04em" }}
      >
        プ・ランニ・ング伍世
      </motion.h1>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: ブリーフ入力 ── */}
        {uiStep === "brief" && (
          <motion.form
            key="brief"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleNext}
            className="w-full max-w-xl"
          >
            {/* Product name */}
            <div className="mb-8">
              <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">製品 / サービス名</p>
              <input
                type="text"
                placeholder="例: Apple Watch"
                value={brief.product_name}
                onChange={(e) => updateField("product_name", e.target.value)}
                required
                autoFocus
                className="w-full bg-transparent text-white placeholder-white/35 outline-none border-b border-white/20 focus:border-white/60 transition-all duration-300 pb-3"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em", fontWeight: 600 }}
              />
            </div>

            {/* Expandable sections */}
            <div className="mb-8">
              {/* Description */}
              <div className="border-t border-white/15">
                <button type="button" onClick={() => setShowDescription(!showDescription)}
                  className="w-full flex items-center justify-between py-3.5 text-white/50 hover:text-white/75 transition-colors text-sm">
                  <span>詳細説明を追加（任意）</span>
                  <motion.span animate={{ rotate: showDescription ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-lg leading-none">+</motion.span>
                </button>
                <AnimatePresence>
                  {showDescription && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pb-3">
                      <textarea placeholder="製品・サービスの概要、特徴、背景情報など..." rows={3} value={brief.product_description ?? ""} onChange={(e) => updateField("product_description", e.target.value)}
                        className="w-full bg-white/[0.06] text-white placeholder-white/35 rounded-xl px-4 py-3 outline-none resize-none border border-white/15 focus:border-white/35 transition-colors text-sm" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* File upload */}
              <div className="border-t border-white/15">
                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex items-center justify-between py-3.5 cursor-pointer transition-colors text-sm ${isDragging ? "text-white/75" : "text-white/50 hover:text-white/75"}`}>
                  <span>参考資料をアップロード（PDF, Word, Excel…）{files.length > 0 ? ` — ${files.length}件` : ""}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <input ref={fileInputRef} type="file" multiple accept={SUPPORTED_FILE_TYPES.join(",")} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                </div>
                <AnimatePresence>
                  {files.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden pb-3 space-y-1.5">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.06] rounded-lg px-3 py-2">
                          <span className="text-xs text-white/60">{file.name} <span className="text-white/40">— {formatFileSize(file.size)}</span></span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-white/20 hover:text-white/60 ml-3 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced */}
              <div className="border-t border-white/15">
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-3.5 text-white/50 hover:text-white/75 transition-colors text-sm">
                  <span>詳細オプション（ターゲット・競合・課題）</span>
                  <motion.span animate={{ rotate: showAdvanced ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-lg leading-none">+</motion.span>
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pb-4 space-y-4">
                      {[
                        { label: "ターゲット市場", key: "target_market" as const, placeholder: "例: 20-40代の健康志向なビジネスパーソン", multiline: false },
                        { label: "現状・課題", key: "current_situation" as const, placeholder: "現在の状況や直面している課題...", multiline: true },
                        { label: "達成したい目標", key: "objectives" as const, placeholder: "この施策で達成したいこと...", multiline: true },
                        { label: "競合情報", key: "competitors" as const, placeholder: "主な競合他社や競合製品...", multiline: false },
                      ].map(({ label, key, placeholder, multiline }) => (
                        <div key={key}>
                          <p className="text-white/50 text-xs tracking-widest uppercase mb-2">{label}</p>
                          {multiline ? (
                            <textarea placeholder={placeholder} rows={2} value={(brief[key] as string) ?? ""} onChange={(e) => updateField(key, e.target.value)}
                              className="w-full bg-white/[0.06] text-white placeholder-white/35 rounded-xl px-4 py-3 outline-none resize-none border border-white/15 focus:border-white/35 transition-colors text-sm" />
                          ) : (
                            <input type="text" placeholder={placeholder} value={(brief[key] as string) ?? ""} onChange={(e) => updateField(key, e.target.value)}
                              className="w-full bg-white/[0.06] text-white placeholder-white/35 rounded-xl px-4 py-3 outline-none border border-white/15 focus:border-white/35 transition-colors text-sm" />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-white/15" />
            </div>

            {/* Next button */}
            <motion.button
              type="submit"
              disabled={!canNext}
              whileHover={canNext ? { scale: 1.01 } : {}}
              whileTap={canNext ? { scale: 0.99 } : {}}
              className="w-full py-4 rounded-2xl font-semibold tracking-wide transition-all duration-300 text-sm flex items-center justify-center gap-2"
              style={{
                background: canNext ? "white" : "rgba(255,255,255,0.06)",
                color: canNext ? "#0a0a0a" : "rgba(255,255,255,0.15)",
              }}
            >
              次へ — 戦略の核心を深掘りする
              {canNext && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>

            <p className="text-white/25 text-xs text-center mt-3 tracking-wide">
              5問の質問に答えるとアウトプットの精度が上がります
            </p>
          </motion.form>
        )}

        {/* ── STEP 2: チャット形式 戦略深掘り ── */}
        {uiStep === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl flex flex-col"
          >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setUiStep("brief"); setChatMessages([]); setChatDone(false); setCurrentQuestionIndex(0); }}
                className="text-white/35 hover:text-white/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <p className="text-white/40 text-xs tracking-[0.15em] uppercase">{brief.product_name}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {chatDone ? "準備完了" : `${currentQuestionIndex + 1} / ${STRATEGY_QUESTIONS.length}`}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-px bg-white/10 rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-white/40 rounded-full"
                animate={{ width: chatDone ? "100%" : `${((currentQuestionIndex) / STRATEGY_QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Chat messages */}
            <div className="flex flex-col gap-4 mb-6 max-h-96 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        {/* Avatar */}
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div
                          className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-white/90 leading-relaxed"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {msg.questionIndex !== undefined && (
                            <p className="text-white/35 text-xs font-bold tracking-widest mb-1.5">
                              {STRATEGY_QUESTIONS[msg.questionIndex].label}
                            </p>
                          )}
                          {msg.content}
                        </div>
                      </div>
                    )}

                    {msg.role === "user" && (
                      <div
                        className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed max-w-[80%]"
                        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        {msg.content}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input area or Submit */}
            <AnimatePresence mode="wait">
              {!chatDone ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 items-end"
                >
                  <div
                    className="flex-1 rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <textarea
                      ref={inputRef}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentQ?.placeholder ?? ""}
                      rows={2}
                      className="w-full bg-transparent text-white placeholder-white/25 px-4 py-3 outline-none resize-none text-sm leading-relaxed"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <motion.button
                      type="button"
                      onClick={handleChatSubmit}
                      disabled={!canSend}
                      whileHover={canSend ? { scale: 1.05 } : {}}
                      whileTap={canSend ? { scale: 0.95 } : {}}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{
                        background: canSend ? "white" : "rgba(255,255,255,0.08)",
                        color: canSend ? "#0a0a0a" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                    {!currentQ?.required && (
                      <button
                        type="button"
                        onClick={handleChatSubmit}
                        className="w-10 h-8 rounded-lg text-white/25 hover:text-white/50 transition-colors text-xs"
                        title="スキップ"
                      >
                        skip
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading ?? false}
                    whileHover={!isLoading ? { scale: 1.01 } : {}}
                    whileTap={!isLoading ? { scale: 0.99 } : {}}
                    className="w-full py-4 rounded-2xl font-semibold tracking-wide transition-all duration-300 text-sm"
                    style={{
                      background: isLoading ? "rgba(255,255,255,0.06)" : "white",
                      color: isLoading ? "rgba(255,255,255,0.15)" : "#0a0a0a",
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="flex gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                          <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                          <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                        </span>
                        分析中...
                      </span>
                    ) : (
                      files.length > 0
                        ? `戦略分析を開始 — ${files.length}ファイル添付`
                        : "戦略分析を開始"
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {!chatDone && (
              <p className="text-white/20 text-xs text-center mt-3">
                Enter で送信 · Shift+Enter で改行{!currentQ?.required ? " · skip で飛ばす" : ""}
              </p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
