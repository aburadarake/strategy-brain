"""Pydantic schemas for Strategy Brain."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


def _coerce_str(v: object) -> str:
    """LLMがdictやlistで返してきた場合に文字列へ強制変換する。"""
    if isinstance(v, dict):
        return ", ".join(f"{k}: {val}" for k, val in v.items())
    if isinstance(v, list):
        return ", ".join(str(i) for i in v)
    return str(v) if v is not None else ""


class LLMBaseModel(BaseModel):
    """str型フィールドにdict/listが来た場合に自動で文字列変換するベースモデル。"""

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def coerce_str_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        for name, field in cls.model_fields.items():
            if name in data and field.annotation is str:
                val = data[name]
                if isinstance(val, (dict, list)):
                    data[name] = _coerce_str(val)
        return data


class BriefInput(BaseModel):
    """Input schema for strategy brief."""

    product_name: str = Field(..., description="製品・サービス名")
    product_description: str = Field(default="", description="製品・サービスの概要（省略可）")
    target_market: str = Field(default="", description="ターゲット市場")
    current_situation: str = Field(default="", description="現状・課題")
    objectives: str = Field(default="", description="達成したい目標")
    competitors: str = Field(default="", description="競合情報")
    additional_info: str = Field(default="", description="その他の情報")


class BarrierItem(LLMBaseModel):
    """Individual barrier item."""

    id: int
    barrier: str
    category: str = Field(description="カテゴリ（製品要因/心理要因/社会的要因/文化・慣習）")


class BarrierAnalysis(BaseModel):
    """STEP 1: Barrier analysis result."""

    barriers: list[BarrierItem] = Field(description="使わない理由リスト（30項目）")


class CausalRelation(LLMBaseModel):
    """Causal relationship between barriers."""

    from_id: int
    to_id: int
    relation: str = Field(description="因果関係の説明")


class CausalityResult(BaseModel):
    """STEP 2: Causality analysis result."""

    relations: list[CausalRelation] = Field(description="因果関係リスト")
    key_barriers: list[int] = Field(description="つながりが多い重要な障壁のID")


class ABCItem(LLMBaseModel):
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


class TargetSegment(LLMBaseModel):
    """Target segment definition."""

    segment_name: str
    description: str
    demographics: str
    psychographics: str
    behaviors: str
    priority: Literal["primary", "secondary"]


class ConsumerInsight(LLMBaseModel):
    """Consumer insight."""

    insight: str
    tension: str = Field(description="消費者が抱える矛盾・葛藤")
    opportunity: str = Field(description="ブランドが入り込む機会")


class NewMarket(LLMBaseModel):
    """新市場・新ターゲットの可能性（Vol.2）."""

    pattern: str = Field(description="パターン種別（延長線上/同心円/異なるところ）")
    target: str = Field(description="新しいターゲット・市場の定義")
    unconventional_use: str = Field(description="常識外れな使い方とそのインサイト")
    opportunity: str = Field(description="このターゲットへの参入機会と戦略的意義")


class WhoAnalysis(BaseModel):
    """WHO analysis result."""

    core_target: dict = Field(description="コアターゲット解剖")
    segments: list[TargetSegment] = Field(description="ターゲットセグメンテーション")
    insights: list[ConsumerInsight] = Field(description="消費者インサイト")
    unmet_needs: list[str] = Field(description="未充足ニーズ")
    new_markets: list[NewMarket] = Field(default=[], description="新市場・新ターゲットの可能性（Vol.2）")


class MarketAnalysis(LLMBaseModel):
    """Market environment analysis."""

    market_overview: str
    competitive_landscape: str
    positioning_opportunity: str


class BrandDiagnosis(LLMBaseModel):
    """Brand diagnosis."""

    strengths: list[str]
    weaknesses: list[str]
    perception_gap: str = Field(description="認識ギャップ")


class ValueProposition(LLMBaseModel):
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
    qualitative_goals: list[str] = Field(default=[], description="定性目標（○○から××へ）3案（Vol.3）")


class DoubtQuestion(LLMBaseModel):
    """細田式3D - Doubtの問い."""

    angle: str = Field(default="", description="固定観念の破壊の角度・切り口")
    question: str = Field(description="疑いの問い（業界固定観念の破壊）")
    insight: str = Field(description="破壊後に見えてくる真実")


class DoubtAnalysis(LLMBaseModel):
    """細田式3D - STEP 1: DOUBT（疑う）."""

    original_challenge: str = Field(description="元の課題")
    questions: list[DoubtQuestion] = Field(description="5つの疑いの問い")
    hidden_assumptions: list[str] = Field(description="前提となっている思い込み")
    average_answers: list[str] = Field(description="AIや競合が出しそうな凡庸な正解")


class ReframingJourney(LLMBaseModel):
    """リフレーミングの変換過程."""

    from_: str = Field(alias="from", description="元のビジネス視点")
    to: str = Field(description="人間視点への変換")
    because: str = Field(description="その背景にある人間の真実")


class DiscoverAnalysis(LLMBaseModel):
    """細田式3D - STEP 2: DISCOVER（発見する）."""

    business_challenge: str = Field(description="元のビジネス課題")
    human_challenge: str = Field(description="人間視点にリフレーミングした課題")
    hidden_truth: str = Field(description="隠れた真実（人間の本音）")
    possibility_to_unlock: str = Field(description="解放すべき可能性")
    reframing_journey: dict = Field(description="リフレーミングの変換過程")


class DesignIdea(LLMBaseModel):
    """細田式3D - Designのアイデア."""

    concept: str = Field(description="可能性解放のコンセプト")
    enables: str = Field(description="〜を可能にする")
    why_not_average: str = Field(description="凡庸でない理由")
    world_after: str = Field(description="実現後の世界観")


class DesignAnalysis(LLMBaseModel):
    """細田式3D - STEP 3: DESIGN（デザインする）."""

    ideas: list[DesignIdea] = Field(description="3つの可能性解放アイデア")
    recommended_idea: int = Field(description="推奨アイデア番号（0-indexed）")
    recommendation_reason: str = Field(description="推奨理由")


class Hosoda3DResult(BaseModel):
    """細田式3Dモデル分析結果."""

    doubt: DoubtAnalysis = Field(description="DOUBT: 疑う")
    discover: DiscoverAnalysis = Field(description="DISCOVER: 発見する")
    design: DesignAnalysis = Field(description="DESIGN: デザインする")


class BigIdea(LLMBaseModel):
    """BIG IDEA result."""

    idea: str = Field(description="BIG IDEA本文")
    rationale: str = Field(description="なぜこのBIG IDEAなのか")
    evaluation: dict = Field(description="5つの評価基準での評価")
    alternative_ideas: list[str] = Field(description="代替案")


class CopyVariation(LLMBaseModel):
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


class OOHCopy(LLMBaseModel):
    """OOH広告コピー案."""

    text: str = Field(description="コピー本文", alias="copy")
    rationale: str = Field(default="", description="コピーの意図")

    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class SNSPost(LLMBaseModel):
    """SNS投稿フォーマット."""

    format: str = Field(description="投稿形式（例: 二択投票, テンプレ投稿, etc.）")
    content: str = Field(description="投稿内容・テンプレート")


class IntegratedCampaign(LLMBaseModel):
    """統合キャンペーン設計（アクアレーベル式）."""

    video_concept: str = Field(default="", description="動画（起点）のコンセプトと15秒/30秒の構成概要")
    kol_strategy: str = Field(default="", description="KOL施策：起用タイプ・投稿方針・ハッシュタグ設計")
    ooh_placement: str = Field(default="", description="OOH展開：掲出場所・クリエイティブ方針")
    ugc_campaign: str = Field(default="", description="UGC/ハッシュタグキャンペーン設計")
    banner_format: str = Field(default="", description="バナー/静止画：フォーマットと展開方針")


class Vol5Evaluation(LLMBaseModel):
    """Vol.5の5軸評価."""

    goal_alignment: int = Field(description="目的適合性（1-10）: ゴールへの最短距離か")
    feasibility: int = Field(description="実現可能性（1-10）: 予算・リソース・納期で実施できるか")
    competitive_advantage: int = Field(description="市場優位性（1-10）: 競合が模倣できない独自性があるか")
    logical_soundness: int = Field(description="論理的整合性（1-10）: インサイトから施策まで飛躍なく筋が通っているか")
    creative_inspiration: int = Field(description="創造的飛躍（1-10）: 期待を超える驚きがあるか")
    total: int = Field(description="合計スコア（/50）")
    verdict: str = Field(default="", description="総評（土台/エンジン/スパーク各レイヤーの評価）")


class AdPlan(LLMBaseModel):
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
    integrated_campaign: IntegratedCampaign | None = Field(default=None, description="統合キャンペーン設計")
    vol5_evaluation: Vol5Evaluation | None = Field(default=None, description="Vol.5の5軸評価")


class AdPlanResult(LLMBaseModel):
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
    desk_research: "DeskResearchResult | None" = Field(default=None, description="デスクリサーチ結果")
    interview_analysis: "InterviewAnalysisResult | None" = Field(default=None, description="インタビュー分析結果")


# ── Vol.5 企画評価（スタンドアロン）────────────────────────────────

class EvaluationAxisScore(LLMBaseModel):
    """5軸評価の1軸分のスコアと詳細."""

    score: int = Field(description="スコア（1-10）")
    strengths: list[str] = Field(description="強み")
    weaknesses: list[str] = Field(description="弱み")
    improvement: str = Field(description="具体的な改善提案")


class EvaluationInput(BaseModel):
    """企画評価の入力."""

    plan_content: str = Field(description="評価対象の企画内容")
    context: str = Field(default="", description="背景情報（オリエン資料等）")
    balance_priority: str = Field(default="", description="評価スタンス（例: 手堅く / 独自性重視）")


class EvaluationResult(BaseModel):
    """5軸評価の結果."""

    plan_title: str = Field(description="企画タイトル/概要")
    goal_alignment: EvaluationAxisScore
    feasibility: EvaluationAxisScore
    competitive_advantage: EvaluationAxisScore
    logical_soundness: EvaluationAxisScore
    creative_inspiration: EvaluationAxisScore
    total_score: int = Field(description="合計スコア（/50）")
    summary: str = Field(description="全体評価サマリー")
    strategic_advice: str = Field(description="企画を化けさせるための一手")
    layer_evaluation: str = Field(description="土台/エンジン/スパーク各レイヤーの評価")


# ── Vol.6 デスクリサーチ────────────────────────────────────────────

class DeskResearchInput(BaseModel):
    """デスクリサーチの入力."""

    category: str = Field(description="業種・カテゴリ名")
    context: str = Field(default="", description="追加情報")
    deep_dive_focus: str = Field(default="", description="深掘りしたいポイント（第2段階用）")


class DeskResearchBlindSpot(LLMBaseModel):
    """デスクリサーチの盲点."""

    title: str
    description: str


class DeskResearchDiscussionPoint(LLMBaseModel):
    """初回ミーティングの論点."""

    title: str
    description: str
    why_interesting: str = Field(default="", description="なぜ面白いか")


class DeskResearchPlayerComm(LLMBaseModel):
    """主要プレイヤーのコミュニケーション戦略."""

    player_name: str
    ad_approach: str = Field(description="広告アプローチ")
    target_definition: str = Field(description="ターゲット定義")
    content_style: str = Field(description="コンテンツスタイル")


class DeskResearchStage1(BaseModel):
    """デスクリサーチ第1段階: 俯瞰マップ."""

    market_structure: str = Field(description="市場構造（規模・バリューチェーン・主要プレイヤー）")
    player_communications: list[DeskResearchPlayerComm] = Field(description="主要プレイヤーのコミュニケーション")
    blind_spots: list[DeskResearchBlindSpot] = Field(description="語られていない盲点5つ")
    discussion_points: list[DeskResearchDiscussionPoint] = Field(description="初回ミーティングの論点5つ")


class DeskResearchHistoryStage(LLMBaseModel):
    """歴史の段階."""

    period: str
    description: str
    why_it_changed: str = Field(description="なぜ変化が起きたか")


class DeskResearchDisruptionPoint(LLMBaseModel):
    """断絶点・境界線."""

    title: str
    description: str
    scenario: str = Field(description="変容が起きる場合のシナリオ")


class DeskResearchStage2(BaseModel):
    """デスクリサーチ第2段階: 深掘り."""

    focus: str = Field(description="深掘り対象")
    history_stages: list[DeskResearchHistoryStage] = Field(description="歴史3段階")
    disruption_points: list[DeskResearchDisruptionPoint] = Field(description="断絶点・境界線")
    opportunities: list[str] = Field(description="コミュニケーション機会3つ")


class DeskResearchResult(BaseModel):
    """デスクリサーチの結果."""

    category: str
    stage1: DeskResearchStage1
    stage2: DeskResearchStage2 | None = None


# ── Vol.7 ソーシャルリスニング────────────────────────────────────

class SocialListeningInput(BaseModel):
    """ソーシャルリスニングの入力."""

    brand_category: str = Field(description="ブランド名・カテゴリ名")
    sns_data: str = Field(description="SNS投稿データ（貼り付け）")
    context: str = Field(default="", description="追加コンテキスト")


class SocialPattern(LLMBaseModel):
    """発話パターン（STEP1）."""

    pattern_name: str
    description: str
    volume: str = Field(description="投稿ボリューム（多い/中程度/少ない）")
    sentiment: str = Field(description="感情（ポジティブ/ネガティブ/ニュートラル）")
    tone: str = Field(description="語るトーン（情報共有/批評/感嘆/愚痴/日常/その他）")
    examples: list[str] = Field(default=[], description="代表的な投稿例")


class SocialInsightCategory(LLMBaseModel):
    """感情・インサイト軸のカテゴリ（STEP2）."""

    category_name: str
    consumer_voice: str = Field(description="生活者の肉声表現")
    description: str
    volume: str = Field(description="ボリューム感")
    key_insight: str = Field(description="このカテゴリのコアインサイト")


class SocialListeningResult(BaseModel):
    """ソーシャルリスニングの結果."""

    brand_category: str
    patterns: list[SocialPattern] = Field(description="STEP1: 発話パターン")
    insight_categories: list[SocialInsightCategory] = Field(description="STEP2: 感情・インサイト軸")
    untold_areas: list[str] = Field(description="語られていない/語られなさすぎる領域")
    strategic_directions: list[str] = Field(description="STEP3: コミュニケーション戦略の方向（3つ）")


# ── Vol.8 インタビュー分析────────────────────────────────────────

class InterviewAnalysisInput(BaseModel):
    """インタビュー分析の入力."""

    transcript: str = Field(description="インタビュー文字起こし")
    research_goal: str = Field(description="調査目的")
    context: str = Field(default="", description="追加情報")


class InterviewKeyStatement(LLMBaseModel):
    """重要発言（STEP1）."""

    content: str = Field(description="発言内容")
    type: str = Field(description="種別: 事実/感情/矛盾/示唆")
    significance: str = Field(description="なぜこの発言が重要か")


class InterviewPattern(LLMBaseModel):
    """パターン（STEP2）."""

    pattern_type: str = Field(description="共通/特異/分岐点")
    title: str
    description: str
    supporting_quotes: list[str] = Field(default=[], description="根拠となる発言")


class InterviewInsight(LLMBaseModel):
    """インサイト（STEP3）."""

    insight_text: str = Field(description="「対象者は○○と思っている。なぜなら△△。しかし実際には□□」形式")
    tension: str = Field(description="この矛盾が生む葛藤")
    opportunity: str = Field(description="コミュニケーション機会")


class InterviewAnalysisResult(BaseModel):
    """インタビュー分析の結果."""

    research_goal: str
    key_statements: list[InterviewKeyStatement] = Field(description="STEP1: 重要発言")
    patterns: list[InterviewPattern] = Field(description="STEP2: パターン")
    insights: list[InterviewInsight] = Field(description="STEP3: インサイト")
    strategic_directions: list[str] = Field(description="STEP4: 戦略への示唆")


# ── WHY/WHO/WHAT/HOW 戦略合成 ─────────────────────────────────────

class StrategySynthesisInput(BaseModel):
    """WHY/WHO/WHAT/HOW戦略合成の入力."""

    product_name: str = Field(description="製品・サービス名")
    research_findings: str = Field(default="", description="リサーチ結果（デスクリサーチ、SNSリスニング、インタビューなど）")
    who_insights: str = Field(default="", description="WHO分析・ターゲットインサイト")
    what_insights: str = Field(default="", description="WHAT分析・価値提案・BIG IDEA")
    how_insights: str = Field(default="", description="HOW分析・広告企画・コミュニケーション施策")
    additional_context: str = Field(default="", description="補足情報")


class WhyFrame(LLMBaseModel):
    """WHY層: なぜこの戦略が必要か."""

    core_tension: str = Field(description="消費者の根本的な葛藤・テンション")
    cultural_context: str = Field(description="背景となる社会・文化的文脈")
    brand_opportunity: str = Field(description="ブランドが入り込む必然性")
    statement: str = Field(description="WHYを1文で表現")


class WhoFrame(LLMBaseModel):
    """WHO層: 誰に向けるのか."""

    primary_target: str = Field(description="主要ターゲット像（ペルソナ）")
    mindset: str = Field(description="ターゲットの心理状態・世界観")
    key_tension: str = Field(description="ターゲットが抱える本質的な葛藤")
    statement: str = Field(description="WHOを1文で表現")


class WhatFrame(LLMBaseModel):
    """WHAT層: 何を伝えるのか."""

    core_message: str = Field(description="ブランドが伝える核心メッセージ")
    brand_role: str = Field(description="このブランドが果たすべき役割")
    value_promise: str = Field(description="ターゲットへの価値の約束")
    statement: str = Field(description="WHATを1文で表現")


class HowFrame(LLMBaseModel):
    """HOW層: どう届けるのか."""

    communication_approach: str = Field(description="コミュニケーションの基本アプローチ")
    key_tactics: list[str] = Field(description="具体的な施策・戦術（3〜5つ）")
    tone_manner: str = Field(description="トーン＆マナー")
    statement: str = Field(description="HOWを1文で表現")


class StrategySynthesisResult(BaseModel):
    """WHY/WHO/WHAT/HOW戦略合成の結果."""

    product_name: str
    strategy_headline: str = Field(description="この戦略全体を貫くヘッドライン")
    why: WhyFrame
    who: WhoFrame
    what: WhatFrame
    how: HowFrame
    strategy_statement: str = Field(description="WHY→WHO→WHAT→HOWをつなぐ戦略ステートメント")
