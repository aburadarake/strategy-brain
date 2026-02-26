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

type Step = "idle" | "uploading" | "barriers" | "who_what" | "bigidea" | "copy" | "complete" | "error";

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

// ストリーミング更新を処理する共通ハンドラを生成する
function makeStreamHandler(
  set: (partial: Partial<StrategyState>) => void,
  onComplete: () => void,
  onError: (msg: string) => void
) {
  return (update: StreamUpdate) => {
    if (update.error) {
      set({
        isLoading: false,
        step: "error",
        error: update.error,
        statusMessage: "エラーが発生しました",
      });
      onError(update.error);
      return;
    }

    switch (update.step) {
      case "hosoda_3d":
        if (update.status === "running") {
          set({ statusMessage: "細田式3D（別視点）分析中..." });
        }
        break;

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
          set({ step: "copy", statusMessage: "コピー・広告企画生成中..." });
        } else if (update.status === "complete" && update.data) {
          set({ copy: update.data as CopyOutput });
        }
        break;

      case "ad_planning":
        if (update.status === "complete" && update.data) {
          set({ adPlanning: update.data as AdPlanResult });
        }
        break;

      case "complete":
        if (update.data) {
          const result = update.data as StrategyResult;
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
          onComplete();
        }
        break;
    }
  };
}

export const useStrategyStore = create<StrategyState>((set) => ({
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

  // ファイルあり分析: ① ファイル要約取得 → ② SSEストリーミング分析
  analyzeWithFiles: async (brief, files) => {
    console.log("[Strategy] Starting analysis with files:", files.length);
    set({
      ...initialState,
      brief,
      files,
      isLoading: true,
      step: "uploading",
      statusMessage:
        files.length > 0
          ? `ファイルをアップロード中... (${files.length}件)`
          : "分析を開始しています...",
    });

    try {
      // Step 1: ファイルをアップロードして要約を取得
      let additionalInfo = brief.additional_info || "";
      if (files.length > 0) {
        set({ statusMessage: "ファイルを解析中..." });
        const fileResult = await api.analyzeFiles(files);
        if (fileResult.summary) {
          additionalInfo += `\n\n## 添付ファイル分析結果\n${fileResult.summary}`;
        }
      }

      // Step 2: SSEストリーミングで分析実行（タイムアウト回避）
      const briefWithFiles: BriefInput = { ...brief, additional_info: additionalInfo };
      set({ step: "barriers", statusMessage: "戦略分析を開始しています..." });

      await new Promise<void>((resolve, reject) => {
        const handler = makeStreamHandler(
          set as (partial: Partial<StrategyState>) => void,
          resolve,
          reject
        );
        api.analyzeStream(briefWithFiles, handler);
      });
    } catch (error) {
      console.error("[Strategy] Error:", error);
      // makeStreamHandler 内でエラー状態は既にセット済み
      if (!(error instanceof Error && error.message.includes("エラー"))) {
        set({
          isLoading: false,
          step: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          statusMessage: "エラーが発生しました",
        });
      }
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

    const handler = makeStreamHandler(
      set as (partial: Partial<StrategyState>) => void,
      () => {},
      () => {}
    );
    api.analyzeStream(brief, handler);
  },

  reset: () => set(initialState),
}));

// Hook for components
export function useStrategy() {
  const store = useStrategyStore();

  const startAnalysis = (brief: BriefInput, files?: File[]) => {
    if (files && files.length > 0) {
      store.analyzeWithFiles(brief, files);
    } else {
      store.analyzeWithStreaming(brief);
    }
  };

  return {
    ...store,
    startAnalysis,
  };
}
