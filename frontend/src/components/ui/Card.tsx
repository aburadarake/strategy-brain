"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  status?: "idle" | "loading" | "complete" | "error";
}

export default function Card({
  children,
  className = "",
  title,
  subtitle,
  status = "idle",
}: CardProps) {
  const statusColors = {
    idle: "border-gray-200",
    loading: "border-blue-400",
    complete: "border-green-400",
    error: "border-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        bg-white rounded-2xl shadow-sm border-2 ${statusColors[status]}
        p-6 ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {status === "loading" && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
              {status === "complete" && (
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
