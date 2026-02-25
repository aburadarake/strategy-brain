"use client";

import { create } from "zustand";
import {
  api,
  BriefInput,
  BarrierResult,
  WhoAnalysis,
  WhatAnalysis,
  BigIdea,
  CopyOutput,
  AdPlanResult,
  Hosoda3DResult,
  StrategyResult,
  StreamUpdate,
} from "@/lib/api";

type Step = "idle" | "barriers" | "who_what" | "bigidea" | "copy" | "complete" | "error";

interface StrategyState {
  // State
  step: Step;
  isLoading: boolean;
  error: string | null;
  brief: BriefInput | null;
  files: File[];
  hosoda3d: Hosoda3DResult | null;
  barriers: BarrierResult | null;
  who: WhoAnalysis | null;
  what: WhatAnalysis | null;
  bigIdea: BigIdea | null;
  copy: CopyOutput | null;
  adPlanning: AdPlanResult | null;
  result: StrategyResult | null;
  statusMessage: string;

  // Actions
  setBrief: (brief: BriefInput) => void;
  setFiles: (files: File[]) => void;
  analyze: (brief: BriefInput) => Promise<void>;
  analyzeWithFiles: (brief: BriefInput, files: File[]) => Promise<void>;
  analyzeWithStreaming: (brief: BriefInput) => void;
  reset: () => void;
}

const initialState = {
  step: "idle" as Step,
  isLoading: false,
  error: null,
  brief: null,
  files: [] as File[],
  hosoda3d: null as Hosoda3DResult | null,
  barriers: null,
  who: null,
  what: null,
  bigIdea: null,
  copy: null,
  adPlanning: null as AdPlanResult | null,
  result: null,
  statusMessage: "",
};

export const useStrategyStore = create<StrategyState>((set, get) => ({
  ...initialState,

  setBrief: (brief) => set({ brief }),

  setFiles: (files) => set({ files }),

  analyze: async (brief) => {
    set({
      ...initialState,
      brief,
      isLoading: true,
      step: "barriers",
      statusMessage: "分析を開始しています...",
    });

    try {
      const result = await api.analyze(brief);
      set({
        isLoading: false,
        step: "complete",
        result,
        hosoda3d: result.hosoda_3d ?? null,
        barriers: result.barriers,
        who: result.who,
        what: result.what,
        bigIdea: result.big_idea,
        copy: result.copywriting,
        adPlanning: result.ad_planning ?? null,
        statusMessage: "分析完了",
      });
    } catch (error) {
      set({
        isLoading: false,
        step: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        statusMessage: "エラーが発生しました",
      });
    }
  },

  analyzeWithFiles: async (brief, files) => {
    console.log("[Strategy] Starting analysis with files:", files.length);
    set({
      ...initialState,
      brief,
      files,
      isLoading: true,
      step: "barriers",
      statusMessage: files.length > 0
        ? `ファイル分析中... (${files.length}件)`
        : "分析を開始しています...",
    });

    try {
      console.log("[Strategy] Calling API...");
      const result = await api.analyzeWithFiles(brief, files);
      console.log("[Strategy] API response received:", result);
      console.log("[Strategy] copywriting field:", result.copywriting);
      set({
        isLoading: false,
        step: "complete",
        result,
        hosoda3d: result.hosoda_3d ?? null,
        barriers: result.barriers,
        who: result.who,
        what: result.what,
        bigIdea: result.big_idea,
        copy: result.copywriting,
        adPlanning: result.ad_planning ?? null,
        statusMessage: "分析完了",
      });
      console.log("[Strategy] State updated to complete");
    } catch (error) {
      console.error("[Strategy] Error:", error);
      set({
        isLoading: false,
        step: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        statusMessage: "エラーが発生しました",
      });
    }
  },

  analyzeWithStreaming: (brief) => {
    set({
      ...initialState,
      brief,
      isLoading: true,
      step: "barriers",
      statusMessage: "分析を開始しています...",
    });

    const handleUpdate = (update: StreamUpdate) => {
      if (update.error) {
        set({
          isLoading: false,
          step: "error",
          error: update.error,
          statusMessage: "エラーが発生しました",
        });
        return;
      }

      switch (update.step) {
        case "barriers":
          if (update.status === "running") {
            set({ step: "barriers", statusMessage: "障壁分析中..." });
          } else if (update.status === "complete" && update.data) {
            set({ barriers: update.data as BarrierResult });
          }
          break;

        case "who_what":
          if (update.status === "running") {
            set({ step: "who_what", statusMessage: "WHO/WHAT分析中..." });
          }
          break;

        case "who":
          if (update.status === "complete" && update.data) {
            set({ who: update.data as WhoAnalysis });
          }
          break;

        case "what":
          if (update.status === "complete" && update.data) {
            set({ what: update.data as WhatAnalysis });
          }
          break;

        case "bigidea":
          if (update.status === "running") {
            set({ step: "bigidea", statusMessage: "BIG IDEA生成中..." });
          } else if (update.status === "complete" && update.data) {
            set({ bigIdea: update.data as BigIdea });
          }
          break;

        case "copy":
          if (update.status === "running") {
            set({ step: "copy", statusMessage: "コピー生成中..." });
          } else if (update.status === "complete" && update.data) {
            set({ copy: update.data as CopyOutput });
          }
          break;

        case "complete":
          if (update.data) {
            set({
              isLoading: false,
              step: "complete",
              result: update.data as StrategyResult,
              statusMessage: "分析完了",
            });
          }
          break;
      }
    };

    api.analyzeStream(brief, handleUpdate);
  },

  reset: () => set(initialState),
}));

// Hook for components
export function useStrategy() {
  const store = useStrategyStore();

  const startAnalysis = (brief: BriefInput, files?: File[]) => {
    if (files && files.length > 0) {
      // Use file upload endpoint
      store.analyzeWithFiles(brief, files);
    } else {
      // Use regular endpoint
      store.analyze(brief);
    }
  };

  return {
    ...store,
    startAnalysis,
  };
}
