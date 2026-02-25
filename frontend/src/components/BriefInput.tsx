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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Hero title */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-20"
      >
        <h1
          className="font-bold text-ink mb-4 tracking-tight"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)", lineHeight: 1.04, letterSpacing: "-0.03em" }}
        >
          プランニ・ング四世
        </h1>
        <p className="text-ink-muted text-lg tracking-wide">
          戦略の深層を、言葉に変える。
        </p>
      </motion.div>

      {/* Form card */}
      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
      >
        {/* Main input */}
        <div className="bg-white rounded-3xl shadow-[0_2px_40px_rgba(0,0,0,0.08)] overflow-hidden mb-4">
          <div className="px-8 pt-8 pb-6">
            <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-3">
              製品 / サービス名
            </label>
            <input
              type="text"
              placeholder="例: Apple Watch"
              value={brief.product_name}
              onChange={(e) => updateField("product_name", e.target.value)}
              required
              className="w-full text-2xl font-semibold text-ink placeholder-ink-faint bg-transparent outline-none border-none"
              style={{ letterSpacing: "-0.01em" }}
            />
          </div>

          {/* Description toggle */}
          <div className="border-t border-gray-100 px-8 py-4">
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <motion.svg
                animate={{ rotate: showDescription ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </motion.svg>
              {showDescription ? "概要を閉じる" : "詳細説明を追加（任意）"}
            </button>
            <AnimatePresence>
              {showDescription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <textarea
                    placeholder="より精度の高い分析のために、詳しい情報を..."
                    rows={4}
                    value={brief.product_description ?? ""}
                    onChange={(e) => updateField("product_description", e.target.value)}
                    className="w-full mt-4 text-base text-ink placeholder-ink-faint bg-gray-50 rounded-2xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File upload */}
          <div className="border-t border-gray-100 px-8 py-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
                isDragging ? "border-ink bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_FILE_TYPES.join(",")}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <svg className="w-6 h-6 mx-auto text-ink-faint mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs text-ink-muted">参考資料をドロップ（PDF, Word, Excel…）</p>
            </div>
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{file.name}</p>
                        <p className="text-xs text-ink-faint">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="text-ink-faint hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced options */}
          <div className="border-t border-gray-100 px-8 py-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              <motion.svg
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </motion.svg>
              詳細オプション
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  {[
                    { label: "ターゲット市場", key: "target_market" as const, placeholder: "例: 20-40代の健康志向なビジネスパーソン", multiline: false },
                    { label: "現状・課題", key: "current_situation" as const, placeholder: "現在の状況や直面している課題...", multiline: true },
                    { label: "達成したい目標", key: "objectives" as const, placeholder: "この施策で達成したいこと...", multiline: true },
                    { label: "競合情報", key: "competitors" as const, placeholder: "主な競合他社や競合製品...", multiline: true },
                    { label: "その他", key: "additional_info" as const, placeholder: "その他、戦略策定に役立つ情報...", multiline: true },
                  ].map(({ label, key, placeholder, multiline }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-ink-faint tracking-widest uppercase mb-2">{label}</label>
                      {multiline ? (
                        <textarea
                          placeholder={placeholder}
                          rows={2}
                          value={(brief[key] as string) ?? ""}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none resize-none border border-gray-100 focus:border-gray-300 transition-colors"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={placeholder}
                          value={(brief[key] as string) ?? ""}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="w-full text-sm text-ink placeholder-ink-faint bg-gray-50 rounded-xl px-4 py-3 outline-none border border-gray-100 focus:border-gray-300 transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!brief.product_name || !!isLoading}
          whileHover={{ scale: brief.product_name && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 rounded-2xl text-base font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: brief.product_name && !isLoading ? "#0a0a0a" : "#d1d1d1",
            color: "white",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="dot-pulse flex gap-1">
                <span className="inline-block w-2 h-2 bg-white rounded-full" />
                <span className="inline-block w-2 h-2 bg-white rounded-full" />
                <span className="inline-block w-2 h-2 bg-white rounded-full" />
              </span>
              分析中...
            </span>
          ) : (
            files.length > 0
              ? `戦略分析を開始 — ${files.length}ファイル添付`
              : "戦略分析を開始"
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
