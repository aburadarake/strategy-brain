"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BriefInput as BriefInputType } from "@/lib/api";

interface BriefInputProps {
  onSubmit: (brief: BriefInputType, files?: File[]) => void;
  isLoading?: boolean;
}

const SUPPORTED_FILE_TYPES = [".pdf",".docx",".doc",".xlsx",".xls",".txt",".md",".csv",".json"];

export default function BriefInput({ onSubmit, isLoading }: BriefInputProps) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.product_name) return;
    onSubmit(brief, files);
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

  const canSubmit = !!brief.product_name && !isLoading;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="text-white/20 text-xs tracking-[0.3em] uppercase mb-8"
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

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
      >
        {/* Product name */}
        <div className="mb-8">
          <p className="text-white/20 text-xs tracking-[0.2em] uppercase mb-3">製品 / サービス名</p>
          <input
            type="text"
            placeholder="例: Apple Watch"
            value={brief.product_name}
            onChange={(e) => updateField("product_name", e.target.value)}
            required
            autoFocus
            className="w-full bg-transparent text-white placeholder-white/15 outline-none border-b border-white/10 focus:border-white/40 transition-all duration-300 pb-3"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em", fontWeight: 600 }}
          />
        </div>

        {/* Expandable sections */}
        <div className="mb-8">
          {/* Description */}
          <div className="border-t border-white/[0.07]">
            <button type="button" onClick={() => setShowDescription(!showDescription)}
              className="w-full flex items-center justify-between py-3.5 text-white/25 hover:text-white/50 transition-colors text-sm">
              <span>詳細説明を追加（任意）</span>
              <motion.span animate={{ rotate: showDescription ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-lg leading-none">+</motion.span>
            </button>
            <AnimatePresence>
              {showDescription && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pb-3">
                  <textarea placeholder="製品・サービスの概要、特徴、背景情報など..." rows={3} value={brief.product_description ?? ""} onChange={(e) => updateField("product_description", e.target.value)}
                    className="w-full bg-white/[0.04] text-white placeholder-white/15 rounded-xl px-4 py-3 outline-none resize-none border border-white/8 focus:border-white/20 transition-colors text-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File upload */}
          <div className="border-t border-white/[0.07]">
            <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-between py-3.5 cursor-pointer transition-colors text-sm ${isDragging ? "text-white/60" : "text-white/25 hover:text-white/50"}`}>
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
                    <div key={i} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                      <span className="text-xs text-white/40">{file.name} <span className="text-white/20">— {formatFileSize(file.size)}</span></span>
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
          <div className="border-t border-white/[0.07]">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-3.5 text-white/25 hover:text-white/50 transition-colors text-sm">
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
                      <p className="text-white/20 text-xs tracking-widest uppercase mb-2">{label}</p>
                      {multiline ? (
                        <textarea placeholder={placeholder} rows={2} value={(brief[key] as string) ?? ""} onChange={(e) => updateField(key, e.target.value)}
                          className="w-full bg-white/[0.04] text-white placeholder-white/15 rounded-xl px-4 py-3 outline-none resize-none border border-white/8 focus:border-white/20 transition-colors text-sm" />
                      ) : (
                        <input type="text" placeholder={placeholder} value={(brief[key] as string) ?? ""} onChange={(e) => updateField(key, e.target.value)}
                          className="w-full bg-white/[0.04] text-white placeholder-white/15 rounded-xl px-4 py-3 outline-none border border-white/8 focus:border-white/20 transition-colors text-sm" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.01 } : {}}
          whileTap={canSubmit ? { scale: 0.99 } : {}}
          className="w-full py-4 rounded-2xl font-semibold tracking-wide transition-all duration-300 text-sm"
          style={{
            background: canSubmit ? "white" : "rgba(255,255,255,0.06)",
            color: canSubmit ? "#0a0a0a" : "rgba(255,255,255,0.15)",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="dot-pulse flex gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-current rounded-full" />
                <span className="inline-block w-1.5 h-1.5 bg-current rounded-full" />
                <span className="inline-block w-1.5 h-1.5 bg-current rounded-full" />
              </span>
              分析中...
            </span>
          ) : (
            files.length > 0 ? `戦略分析を開始 — ${files.length}ファイル添付` : "戦略分析を開始"
          )}
        </motion.button>
      </motion.form>
    </section>
  );
}
