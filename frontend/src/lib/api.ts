// 本番: NEXT_PUBLIC_API_URL 環境変数 (Vercel に設定)
// 開発: localhost:8001
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `http://${window.location.hostname}:8001/api`
    : "http://localhost:8001/api");

export interface BriefInput {
  product_name: string;
  product_description?: string;
  target_market?: string;
  current_situation?: string;
  objectives?: string;
  competitors?: string;
  additional_info?: string;
}

export interface BarrierItem {
  id: number;
  barrier: string;
  category: string;
}

export interface CausalRelation {
  from_id: number;
  to_id: number;
  relation: string;
}

export interface ABCItem {
  barrier_id: number;
  barrier: string;
  classification: "A" | "B" | "C";
  solution_approach: string;
}

export interface BarrierResult {
  barriers: { barriers: BarrierItem[] };
  causality: { relations: CausalRelation[]; key_barriers: number[] };
  classification: { a_items: ABCItem[]; b_items: ABCItem[]; c_items: ABCItem[] };
  mermaid_diagram: string;
}

export interface TargetSegment {
  segment_name: string;
  description: string;
  demographics: string;
  psychographics: string;
  behaviors: string;
  priority: "primary" | "secondary";
}

export interface ConsumerInsight {
  insight: string;
  tension: string;
  opportunity: string;
}

export interface WhoAnalysis {
  core_target: Record<string, string>;
  segments: TargetSegment[];
  insights: ConsumerInsight[];
  unmet_needs: string[];
}

export interface WhatAnalysis {
  market_analysis: {
    market_overview: string;
    competitive_landscape: string;
    positioning_opportunity: string;
  };
  brand_diagnosis: {
    strengths: string[];
    weaknesses: string[];
    perception_gap: string;
  };
  barrier_strategies: { barrier: string; strategy: string }[];
  value_proposition: {
    functional_value: string;
    emotional_value: string;
    social_value: string;
    core_proposition: string;
  };
  differentiation: string[];
}

export interface BigIdea {
  idea: string;
  rationale: string;
  evaluation: Record<string, { score: number; reason: string }>;
  alternative_ideas: string[];
}

export interface CopyVariation {
  headline: string;
  subhead?: string;
  body?: string;
  angle: string;
  technique: string;
  why_it_works?: string;
}

export interface CopyOutput {
  strategic_brief: Record<string, string>;
  variations: CopyVariation[];
  recommended: number;
  recommendation_reason: string;
}

export interface OOHCopy {
  text?: string;
  copy?: string; // alias from API
  rationale: string;
}

export interface SNSPost {
  format: string;
  content: string;
}

export interface AdPlan {
  plan_name: string;
  method: string;
  core_message: string;
  mechanism: string;
  ooh_copies: OOHCopy[];
  sns_posts: SNSPost[];
  experiential_tactic: string;
  success_criteria: string;
  kpi_examples: string[];
}

export interface AdPlanResult {
  brand_concept: string;
  concept_story: string;
  new_perspectives: { title: string; description: string }[];
  plans: AdPlan[];
  recommended_plan: number;
  recommendation_reason: string;
}

// ── 細田式3Dモデル（別視点分析）────────────────────────────────
export interface DoubtQuestion {
  angle?: string;
  question: string;
  insight: string;
}

export interface DoubtAnalysis {
  original_challenge: string;
  questions: DoubtQuestion[];
  hidden_assumptions: string[];
  average_answers: string[];
}

export interface DiscoverAnalysis {
  business_challenge: string;
  human_challenge: string;
  hidden_truth: string;
  possibility_to_unlock: string;
  reframing_journey: {
    from: string;
    to: string;
    because: string;
  };
}

export interface DesignIdea {
  concept: string;
  enables: string;
  why_not_average: string;
  world_after: string;
}

export interface DesignAnalysis {
  ideas: DesignIdea[];
  recommended_idea: number;
  recommendation_reason: string;
}

export interface Hosoda3DResult {
  doubt: DoubtAnalysis;
  discover: DiscoverAnalysis;
  design: DesignAnalysis;
}

export interface StrategyResult {
  brief: BriefInput;
  hosoda_3d?: Hosoda3DResult;
  barriers: BarrierResult;
  who: WhoAnalysis;
  what: WhatAnalysis;
  big_idea: BigIdea;
  copywriting: CopyOutput;
  ad_planning?: AdPlanResult;
}

// ── Vol.5 企画評価 ──────────────────────────────────────────────

export interface EvaluationAxisScore {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

export interface EvaluationInput {
  plan_content: string;
  context?: string;
  balance_priority?: string;
}

export interface EvaluationResult {
  plan_title: string;
  goal_alignment: EvaluationAxisScore;
  feasibility: EvaluationAxisScore;
  competitive_advantage: EvaluationAxisScore;
  logical_soundness: EvaluationAxisScore;
  creative_inspiration: EvaluationAxisScore;
  total_score: number;
  summary: string;
  strategic_advice: string;
  layer_evaluation: string;
}

// ── Vol.6 デスクリサーチ ─────────────────────────────────────────

export interface DeskResearchInput {
  category: string;
  context?: string;
  deep_dive_focus?: string;
}

export interface DeskResearchBlindSpot {
  title: string;
  description: string;
}

export interface DeskResearchDiscussionPoint {
  title: string;
  description: string;
  why_interesting?: string;
}

export interface DeskResearchPlayerComm {
  player_name: string;
  ad_approach: string;
  target_definition: string;
  content_style: string;
}

export interface DeskResearchStage1 {
  market_structure: string;
  player_communications: DeskResearchPlayerComm[];
  blind_spots: DeskResearchBlindSpot[];
  discussion_points: DeskResearchDiscussionPoint[];
}

export interface DeskResearchHistoryStage {
  period: string;
  description: string;
  why_it_changed: string;
}

export interface DeskResearchDisruptionPoint {
  title: string;
  description: string;
  scenario: string;
}

export interface DeskResearchStage2 {
  focus: string;
  history_stages: DeskResearchHistoryStage[];
  disruption_points: DeskResearchDisruptionPoint[];
  opportunities: string[];
}

export interface DeskResearchResult {
  category: string;
  stage1: DeskResearchStage1;
  stage2?: DeskResearchStage2;
}

// ── Vol.7 ソーシャルリスニング ────────────────────────────────────

export interface SocialListeningInput {
  brand_category: string;
  sns_data: string;
  context?: string;
}

export interface SocialPattern {
  pattern_name: string;
  description: string;
  volume: string;
  sentiment: string;
  tone: string;
  examples: string[];
}

export interface SocialInsightCategory {
  category_name: string;
  consumer_voice: string;
  description: string;
  volume: string;
  key_insight: string;
}

export interface SocialListeningResult {
  brand_category: string;
  patterns: SocialPattern[];
  insight_categories: SocialInsightCategory[];
  untold_areas: string[];
  strategic_directions: string[];
}

// ── Vol.8 インタビュー分析 ────────────────────────────────────────

export interface InterviewAnalysisInput {
  transcript: string;
  research_goal: string;
  context?: string;
}

export interface InterviewKeyStatement {
  content: string;
  type: string;
  significance: string;
}

export interface InterviewPattern {
  pattern_type: string;
  title: string;
  description: string;
  supporting_quotes: string[];
}

export interface InterviewInsight {
  insight_text: string;
  tension: string;
  opportunity: string;
}

export interface InterviewAnalysisResult {
  research_goal: string;
  key_statements: InterviewKeyStatement[];
  patterns: InterviewPattern[];
  insights: InterviewInsight[];
  strategic_directions: string[];
}

// ── WHY/WHO/WHAT/HOW 戦略合成 ────────────────────────────────────

export interface StrategySynthesisInput {
  product_name: string;
  research_findings?: string;
  who_insights?: string;
  what_insights?: string;
  how_insights?: string;
  additional_context?: string;
}

export interface WhyFrame {
  core_tension: string;
  cultural_context: string;
  brand_opportunity: string;
  statement: string;
}

export interface WhoFrame {
  primary_target: string;
  mindset: string;
  key_tension: string;
  statement: string;
}

export interface WhatFrame {
  core_message: string;
  brand_role: string;
  value_promise: string;
  statement: string;
}

export interface HowFrame {
  communication_approach: string;
  key_tactics: string[];
  tone_manner: string;
  statement: string;
}

export interface StrategySynthesisResult {
  product_name: string;
  strategy_headline: string;
  why: WhyFrame;
  who: WhoFrame;
  what: WhatFrame;
  how: HowFrame;
  strategy_statement: string;
}

export interface StreamUpdate {
  step: string;
  status?: "running" | "complete";
  message?: string;
  data?: unknown;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async analyze(brief: BriefInput): Promise<StrategyResult> {
    // 10 minute timeout for long analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("リクエストがタイムアウトしました（10分）。もう一度お試しください。");
      }
      throw error;
    }
  }

  analyzeStream(
    brief: BriefInput,
    onUpdate: (update: StreamUpdate) => void
  ): () => void {
    const controller = new AbortController();

    fetch(`${this.baseUrl}/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                onUpdate(data);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          onUpdate({ step: "error", error: error.message });
        }
      });

    return () => controller.abort();
  }

  async analyzeBarriers(brief: BriefInput): Promise<BarrierResult> {
    const response = await fetch(`${this.baseUrl}/barriers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async analyzeWho(brief: BriefInput): Promise<WhoAnalysis> {
    const response = await fetch(`${this.baseUrl}/who`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async analyzeWhat(brief: BriefInput): Promise<WhatAnalysis> {
    const response = await fetch(`${this.baseUrl}/what`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async generateBigIdea(brief: BriefInput): Promise<BigIdea> {
    const response = await fetch(`${this.baseUrl}/bigidea`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async generateCopy(brief: BriefInput): Promise<CopyOutput> {
    const response = await fetch(`${this.baseUrl}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brief),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async analyzeWithFiles(brief: BriefInput, files: File[]): Promise<StrategyResult> {
    const formData = new FormData();

    // Add brief fields
    formData.append("product_name", brief.product_name);
    formData.append("product_description", brief.product_description ?? "");
    formData.append("target_market", brief.target_market || "");
    formData.append("current_situation", brief.current_situation || "");
    formData.append("objectives", brief.objectives || "");
    formData.append("competitors", brief.competitors || "");
    formData.append("additional_info", brief.additional_info || "");

    // Add files
    for (const file of files) {
      formData.append("files", file);
    }

    // 10 minute timeout for long analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      const response = await fetch(`${this.baseUrl}/analyze/with-files`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("リクエストがタイムアウトしました（10分）。もう一度お試しください。");
      }
      throw error;
    }
  }

  async analyzeFiles(files: File[]): Promise<{ files: { filename: string; file_type: string; char_count: number }[]; summary: string }> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch(`${this.baseUrl}/files/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async deskResearch(input: DeskResearchInput): Promise<DeskResearchResult> {
    const response = await fetch(`${this.baseUrl}/desk-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async deskResearchDeepDive(input: DeskResearchInput): Promise<DeskResearchStage2> {
    const response = await fetch(`${this.baseUrl}/desk-research/deep-dive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async socialListening(input: SocialListeningInput): Promise<SocialListeningResult> {
    const response = await fetch(`${this.baseUrl}/social-listening`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async interviewAnalysis(input: InterviewAnalysisInput): Promise<InterviewAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/interview-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async strategySynthesis(input: StrategySynthesisInput): Promise<StrategySynthesisResult> {
    const response = await fetch(`${this.baseUrl}/strategy-synthesis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }
}

export const api = new ApiClient();
