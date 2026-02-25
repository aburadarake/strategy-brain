"""広告企画6案生成モジュール."""

from pathlib import Path

from app.models.schemas import (
    BriefInput,
    WhoAnalysis,
    WhatAnalysis,
    BigIdea,
    AdPlanResult,
    AdPlan,
    OOHCopy,
    SNSPost,
)
from app.services.llm import LLMService


class AdPlanGenerator:
    """6つの発想法を使った広告企画を生成するクラス."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "ad_planning.txt"

    def _load_system_prompt(self) -> str:
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(
        self,
        brief: BriefInput,
        who: WhoAnalysis,
        what: WhatAnalysis,
        big_idea: BigIdea,
    ) -> str:
        # Extract key insights
        primary_segment = next(
            (s for s in who.segments if s.priority == "primary"),
            who.segments[0] if who.segments else None,
        )
        target_desc = primary_segment.description if primary_segment else "未指定"
        key_insight = who.insights[0].insight if who.insights else "未指定"
        key_tension = who.insights[0].tension if who.insights else "未指定"

        desc = brief.product_description or "（商品名から推測してください）"

        return f"""## 案件情報

**製品・サービス名**: {brief.product_name}
**製品・サービス概要**: {desc}
**ターゲット市場**: {brief.target_market or "未指定"}
**達成目標**: {brief.objectives or "未指定"}

## BIG IDEA
{big_idea.idea}

## コアターゲット
{target_desc}

## 核となるインサイト
{key_insight}

## ターゲットの葛藤
{key_tension}

## 提供価値
- 機能的価値: {what.value_proposition.functional_value}
- 情緒的価値: {what.value_proposition.emotional_value}
- 社会的価値: {what.value_proposition.social_value}
- コアプロポジション: {what.value_proposition.core_proposition}

## 差別化要素
{', '.join(what.differentiation[:3])}

上記の情報を踏まえて、6つの発想法それぞれを用いた広告企画を1案ずつ生成してください。"""

    async def generate(
        self,
        brief: BriefInput,
        who: WhoAnalysis,
        what: WhatAnalysis,
        big_idea: BigIdea,
    ) -> AdPlanResult:
        """広告企画6案を生成する."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(brief, who, what, big_idea)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.85,
            max_tokens=8192,
        )

        # Parse plans
        plans = []
        for plan_data in result.get("plans", []):
            ooh_copies = [
                OOHCopy(
                    text=c.get("copy", ""),
                    rationale=c.get("rationale", ""),
                )
                for c in plan_data.get("ooh_copies", [])
            ]
            sns_posts = [
                SNSPost(
                    format=p.get("format", ""),
                    content=p.get("content", ""),
                )
                for p in plan_data.get("sns_posts", [])
            ]
            plans.append(
                AdPlan(
                    plan_name=plan_data.get("plan_name", ""),
                    method=plan_data.get("method", ""),
                    core_message=plan_data.get("core_message", ""),
                    mechanism=plan_data.get("mechanism", ""),
                    ooh_copies=ooh_copies,
                    sns_posts=sns_posts,
                    experiential_tactic=plan_data.get("experiential_tactic", ""),
                    success_criteria=plan_data.get("success_criteria", ""),
                    kpi_examples=plan_data.get("kpi_examples", []),
                )
            )

        return AdPlanResult(
            brand_concept=result.get("brand_concept", ""),
            concept_story=result.get("concept_story", ""),
            new_perspectives=result.get("new_perspectives", []),
            plans=plans,
            recommended_plan=result.get("recommended_plan", 0),
            recommendation_reason=result.get("recommendation_reason", ""),
        )
