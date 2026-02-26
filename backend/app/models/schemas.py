"""Pydantic schemas for Strategy Brain."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BriefInput(BaseModel):
    """Input schema for strategy brief."""

    product_name: str = Field(..., description="製品・サービス名")
    product_description: str = Field(default="", description="製品・サービスの概要（省略可）")
    target_market: str = Field(default="", description="ターゲット市場")
    current_situation: str = Field(default="", description="現状・課題")
    objectives: str = Field(default="", description="達成したい目標")
    competitors: str = Field(default="", description="競合情報")
    additional_info: str = Field(default="", description="その他の情報")


class BarrierItem(BaseModel):
    """Individual barrier item."""

    id: int
    barrier: str
    category: str = Field(description="カテゴリ（製品要因/心理要因/社会的要因/文化・慣習）")


class BarrierAnalysis(BaseModel):
    """STEP 1: Barrier analysis result."""

    barriers: list[BarrierItem] = Field(description="使わない理由リスト（30項目）")


class CausalRelation(BaseModel):
    """Causal relationship between barriers."""

    from_id: int
    to_id: int
    relation: str = Field(description="因果関係の説明")


class CausalityResult(BaseModel):
    """STEP 2: Causality analysis result."""

    relations: list[CausalRelation] = Field(description="因果関係リスト")
    key_barriers: list[int] = Field(description="つながりが多い重要な障壁のID")


class ABCItem(BaseModel):
    """ABC classified barrier item."""

    barrier_id: int
    barrier: str
    classification: Literal["A", "B", "C"]
    solution_approach: str = Field(description="解決アプローチ")


class ABCClassification(BaseModel):
    """STEP 3: ABC classification result."""

    a_items: list[ABCItem] = Field(description="A: サービスで解決できるもの")
    b_items: list[ABCItem] = Field(description="B: 広告・ブランディングで解決できるもの")
    c_items: list[ABCItem] = Field(description="C: PR・社会変容で解決できること")


class BarrierResult(BaseModel):
    """Combined result of STEP 1-4."""

    barriers: BarrierAnalysis
    causality: CausalityResult
    classification: ABCClassification
    mermaid_diagram: str = Field(description="Mermaid形式の図解")


class TargetSegment(BaseModel):
    """Target segment definition."""

    model_config = ConfigDict(extra="ignore")

    segment_name: str
    description: str
    demographics: str
    psychographics: str
    behaviors: str
    priority: Literal["primary", "secondary"]

    @field_validator("demographics", "psychographics", "behaviors", mode="before")
    @classmethod
    def coerce_to_str(cls, v: object) -> str:
        if isinstance(v, dict):
            return ", ".join(f"{k}: {val}" for k, val in v.items())
        if isinstance(v, list):
            return ", ".join(str(i) for i in v)
        return str(v) if v is not None else ""


class ConsumerInsight(BaseModel):
    """Consumer insight."""

    insight: str
    tension: str = Field(description="消費者が抱える矛盾・葛藤")
    opportunity: str = Field(description="ブランドが入り込む機会")


class WhoAnalysis(BaseModel):
    """WHO analysis result."""

    core_target: dict = Field(description="コアターゲット解剖")
    segments: list[TargetSegment] = Field(description="ターゲットセグメンテーション")
    insights: list[ConsumerInsight] = Field(description="消費者インサイト")
    unmet_needs: list[str] = Field(description="未充足ニーズ")


class MarketAnalysis(BaseModel):
    """Market environment analysis."""

    market_overview: str
    competitive_landscape: str
    positioning_opportunity: str


class BrandDiagnosis(BaseModel):
    """Brand diagnosis."""

    strengths: list[str]
    weaknesses: list[str]
    perception_gap: str = Field(description="認識ギャップ")


class ValueProposition(BaseModel):
    """Value proposition."""

    functional_value: str
    emotional_value: str
    social_value: str
    core_proposition: str


class WhatAnalysis(BaseModel):
    """WHAT analysis result."""

    market_analysis: MarketAnalysis
    brand_diagnosis: BrandDiagnosis
    barrier_strategies: list[dict] = Field(description="障壁打破戦略")
    value_proposition: ValueProposition
    differentiation: list[str] = Field(description="戦略的差別化要素")


class DoubtQuestion(BaseModel):
    """細田式3D - Doubtの問い."""

    angle: str = Field(default="", description="固定観念の破壊の角度・切り口")
    question: str = Field(description="疑いの問い（業界固定観念の破壊）")
    insight: str = Field(description="破壊後に見えてくる真実")


class DoubtAnalysis(BaseModel):
    """細田式3D - STEP 1: DOUBT（疑う）."""

    original_challenge: str = Field(description="元の課題")
    questions: list[DoubtQuestion] = Field(description="5つの疑いの問い")
    hidden_assumptions: list[str] = Field(description="前提となっている思い込み")
    average_answers: list[str] = Field(description="AIや競合が出しそうな凡庸な正解")


class ReframingJourney(BaseModel):
    """リフレーミングの変換過程."""

    from_: str = Field(alias="from", description="元のビジネス視点")
    to: str = Field(description="人間視点への変換")
    because: str = Field(description="その背景にある人間の真実")


class DiscoverAnalysis(BaseModel):
    """細田式3D - STEP 2: DISCOVER（発見する）."""

    business_challenge: str = Field(description="元のビジネス課題")
    human_challenge: str = Field(description="人間視点にリフレーミングした課題")
    hidden_truth: str = Field(description="隠れた真実（人間の本音）")
    possibility_to_unlock: str = Field(description="解放すべき可能性")
    reframing_journey: dict = Field(description="リフレーミングの変換過程")


class DesignIdea(BaseModel):
    """細田式3D - Designのアイデア."""

    concept: str = Field(description="可能性解放のコンセプト")
    enables: str = Field(description="〜を可能にする")
    why_not_average: str = Field(description="凡庸でない理由")
    world_after: str = Field(description="実現後の世界観")


class DesignAnalysis(BaseModel):
    """細田式3D - STEP 3: DESIGN（デザインする）."""

    ideas: list[DesignIdea] = Field(description="3つの可能性解放アイデア")
    recommended_idea: int = Field(description="推奨アイデア番号（0-indexed）")
    recommendation_reason: str = Field(description="推奨理由")


class Hosoda3DResult(BaseModel):
    """細田式3Dモデル分析結果."""

    doubt: DoubtAnalysis = Field(description="DOUBT: 疑う")
    discover: DiscoverAnalysis = Field(description="DISCOVER: 発見する")
    design: DesignAnalysis = Field(description="DESIGN: デザインする")


class BigIdea(BaseModel):
    """BIG IDEA result."""

    idea: str = Field(description="BIG IDEA本文")
    rationale: str = Field(description="なぜこのBIG IDEAなのか")
    evaluation: dict = Field(description="5つの評価基準での評価")
    alternative_ideas: list[str] = Field(description="代替案")


class CopyVariation(BaseModel):
    """Copy variation."""

    headline: str
    subhead: str = ""
    body: str = ""
    angle: str = Field(description="表現アングル")
    technique: str = Field(description="使用テクニック")
    why_it_works: str = Field(default="", description="なぜ刺さるか")


class CopyOutput(BaseModel):
    """Copywriting result."""

    strategic_brief: dict = Field(description="戦略ブリーフ（GOAL/WHO/VALUE/ANGLE/TONE）")
    variations: list[CopyVariation] = Field(description="コピー案10本")
    recommended: int = Field(description="推奨案の番号（0-indexed）")
    recommendation_reason: str


class OOHCopy(BaseModel):
    """OOH広告コピー案."""
    text: str = Field(description="コピー本文", alias="copy")
    rationale: str = Field(default="", description="コピーの意図")

    model_config = {"populate_by_name": True}


class SNSPost(BaseModel):
    """SNS投稿フォーマット."""
    format: str = Field(description="投稿形式（例: 二択投票, テンプレ投稿, etc.）")
    content: str = Field(description="投稿内容・テンプレート")


class AdPlan(BaseModel):
    """広告企画案（1案）."""
    plan_name: str = Field(description="企画名")
    method: str = Field(description="使用した発想法")
    core_message: str = Field(description="コアメッセージ（1行）")
    mechanism: str = Field(description="企画の仕組み・どう広がるか")
    ooh_copies: list[OOHCopy] = Field(description="OOH広告コピー案5本")
    sns_posts: list[SNSPost] = Field(description="SNS投稿フォーマット2つ")
    experiential_tactic: str = Field(description="体験/プロダクト/イベント/PR施策")
    success_criteria: str = Field(description="成功条件")
    kpi_examples: list[str] = Field(description="KPI例")


class AdPlanResult(BaseModel):
    """広告企画6案の結果."""
    brand_concept: str = Field(description="ブランドコンセプト（一言）")
    concept_story: str = Field(description="コンセプトのストーリー・背景")
    new_perspectives: list[dict] = Field(description="商材に対する新しい視点5項目以上")
    plans: list[AdPlan] = Field(description="発想法別広告企画6案")
    recommended_plan: int = Field(description="推奨企画番号（0-indexed）")
    recommendation_reason: str = Field(description="推奨理由")


class StrategyResult(BaseModel):
    """Complete strategy result."""

    brief: BriefInput
    hosoda_3d: Hosoda3DResult | None = Field(default=None, description="細田式3Dモデル分析")
    barriers: BarrierResult
    who: WhoAnalysis
    what: WhatAnalysis
    big_idea: BigIdea
    copywriting: CopyOutput
    ad_planning: AdPlanResult | None = Field(default=None, description="広告企画6案")
