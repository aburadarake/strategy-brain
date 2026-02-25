"""WHAT Analysis - 市場環境とブランド価値分析."""

from pathlib import Path

from app.models.schemas import BriefInput, BarrierResult, WhatAnalysis
from app.services.llm import LLMService


class WhatAnalyzer:
    """Analyzes market environment and brand value (WHAT)."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "what.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(
        self, brief: BriefInput, barriers: BarrierResult | None = None
    ) -> str:
        """Build user prompt from brief and barriers."""
        prompt = f"""## ブリーフ情報

**製品・サービス名**: {brief.product_name}

**製品・サービス概要**:
{brief.product_description}

**ターゲット市場**:
{brief.target_market or "未指定"}

**現状・課題**:
{brief.current_situation or "未指定"}

**達成目標**:
{brief.objectives or "未指定"}

**競合情報**:
{brief.competitors or "未指定"}
"""

        if barriers:
            # Add ABC classification insights
            prompt += "\n## ABC分類済み障壁\n"
            prompt += "\n### A: サービスで解決できるもの\n"
            for item in barriers.classification.a_items[:5]:
                prompt += f"- {item.barrier}: {item.solution_approach}\n"

            prompt += "\n### B: 広告・ブランディングで解決できるもの\n"
            for item in barriers.classification.b_items[:5]:
                prompt += f"- {item.barrier}: {item.solution_approach}\n"

            prompt += "\n### C: PR・社会変容で解決できること\n"
            for item in barriers.classification.c_items[:5]:
                prompt += f"- {item.barrier}: {item.solution_approach}\n"

        prompt += "\n上記に基づいて、WHAT分析を行ってください。"
        return prompt

    async def analyze(
        self, brief: BriefInput, barriers: BarrierResult | None = None
    ) -> WhatAnalysis:
        """Analyze market environment and brand value."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(brief, barriers)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        try:
            return WhatAnalysis(**result)
        except Exception:
            from app.models.schemas import MarketAnalysis, BrandDiagnosis, ValueProposition
            ma = result.get("market_analysis", {})
            bd = result.get("brand_diagnosis", {})
            vp = result.get("value_proposition", {})
            return WhatAnalysis(
                market_analysis=MarketAnalysis(
                    market_overview=ma.get("market_overview", ""),
                    competitive_landscape=ma.get("competitive_landscape", ""),
                    positioning_opportunity=ma.get("positioning_opportunity", ""),
                ),
                brand_diagnosis=BrandDiagnosis(
                    strengths=bd.get("strengths", []),
                    weaknesses=bd.get("weaknesses", []),
                    perception_gap=bd.get("perception_gap", ""),
                ),
                barrier_strategies=result.get("barrier_strategies", []),
                value_proposition=ValueProposition(
                    functional_value=vp.get("functional_value", ""),
                    emotional_value=vp.get("emotional_value", ""),
                    social_value=vp.get("social_value", ""),
                    core_proposition=vp.get("core_proposition", ""),
                ),
                differentiation=result.get("differentiation", []),
            )
