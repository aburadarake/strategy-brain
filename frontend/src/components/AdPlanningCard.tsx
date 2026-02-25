"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./ui/Card";
import { AdPlanResult, AdPlan } from "@/lib/api";

interface AdPlanningCardProps {
  data: AdPlanResult;
}

const METHOD_COLORS: Record<string, string> = {
  "①": "bg-purple-100 text-purple-800 border-purple-200",
  "②": "bg-blue-100 text-blue-800 border-blue-200",
  "③": "bg-green-100 text-green-800 border-green-200",
  "④": "bg-orange-100 text-orange-800 border-orange-200",
  "⑤": "bg-pink-100 text-pink-800 border-pink-200",
  "⑥": "bg-teal-100 text-teal-800 border-teal-200",
};

function getMethodColor(method: string): string {
  for (const [num, color] of Object.entries(METHOD_COLORS)) {
    if (method.includes(num)) return color;
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function AdPlanDetail({ plan, index, isRecommended }: { plan: AdPlan; index: number; isRecommended: boolean }) {
  const [expanded, setExpanded] = useState(isRecommended);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border-2 overflow-hidden ${
        isRecommended
          ? "border-yellow-400 shadow-md"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left p-4 flex items-start justify-between gap-3 ${
          isRecommended ? "bg-yellow-50" : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-lg font-bold text-gray-400 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {isRecommended && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  推奨
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getMethodColor(
                  plan.method
                )}`}
              >
                {plan.method}
              </span>
            </div>
            <h4 className="font-bold text-gray-900 text-base">{plan.plan_name}</h4>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{plan.core_message}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform mt-1 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 bg-white border-t border-gray-100">
              {/* Mechanism */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  企画の仕組み
                </h5>
                <p className="text-sm text-gray-700">{plan.mechanism}</p>
              </div>

              {/* OOH Copies */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  OOH広告コピー案
                </h5>
                <div className="space-y-2">
                  {plan.ooh_copies.map((ooh, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900 text-sm">
                        「{ooh.text ?? ooh.copy}」
                      </p>
                      {ooh.rationale && (
                        <p className="text-xs text-gray-500 mt-1">{ooh.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SNS Posts */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  SNS施策
                </h5>
                <div className="space-y-2">
                  {plan.sns_posts.map((post, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <span className="text-xs font-semibold text-blue-700">
                        {post.format}
                      </span>
                      <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experiential Tactic */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  体験・PR施策
                </h5>
                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 border border-green-100">
                  {plan.experiential_tactic}
                </p>
              </div>

              {/* Success Criteria & KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    成功条件
                  </h5>
                  <p className="text-sm text-gray-700">{plan.success_criteria}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    KPI例
                  </h5>
                  <ul className="space-y-1">
                    {plan.kpi_examples.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                        <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdPlanningCard({ data }: AdPlanningCardProps) {
  return (
    <Card
      title="広告企画 6案"
      subtitle="6つの発想法から生まれたクリエイティブ企画"
      status="complete"
    >
      <div className="space-y-6">
        {/* Brand Concept */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
            ブランドコンセプト
          </h4>
          <p className="text-2xl font-bold text-gray-900 mb-3">{data.brand_concept}</p>
          <p className="text-sm text-gray-700">{data.concept_story}</p>
        </div>

        {/* New Perspectives */}
        {data.new_perspectives.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              商材に対する新しい視点
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.new_perspectives.map((p, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-indigo-300 transition-colors"
                >
                  <p className="text-xs font-semibold text-indigo-700 mb-1">{p.title}</p>
                  <p className="text-xs text-gray-600">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation Reason */}
        {data.recommendation_reason && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-800 mb-1">推奨企画について</p>
            <p className="text-sm text-gray-700">{data.recommendation_reason}</p>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-3">
          {data.plans.map((plan, index) => (
            <AdPlanDetail
              key={index}
              plan={plan}
              index={index}
              isRecommended={index === data.recommended_plan}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
