"""BIG IDEA Generation - ビッグアイデア生成."""

from pathlib import Path

from app.models.schemas import WhoAnalysis, WhatAnalysis, BigIdea
from app.services.llm import LLMService


class BigIdeaGenerator:
    """Generates BIG IDEA based on WHO and WHAT analysis."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "bigidea.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(self, who: WhoAnalysis, what: WhatAnalysis) -> str:
        """Build user prompt from WHO and WHAT analysis."""
        # Extract key insights from WHO
        insights_text = "\n".join(
            f"- {i.insight} (テンション: {i.tension})"
            for i in who.insights
        )
        unmet_needs_text = "\n".join(f"- {n}" for n in who.unmet_needs)

        # Extract key points from WHAT
        strengths_text = "\n".join(f"- {s}" for s in what.brand_diagnosis.strengths)
        differentiation_text = "\n".join(f"- {d}" for d in what.differentiation)

        return f"""## WHO分析サマリー

### コアターゲット
{who.core_target}

### 消費者インサイト
{insights_text}

### 未充足ニーズ
{unmet_needs_text}

## WHAT分析サマリー

### ブランドの強み
{strengths_text}

### コア・バリュー・プロポジション
{what.value_proposition.core_proposition}

### 戦略的差別化要素
{differentiation_text}

### ポジショニング機会
{what.market_analysis.positioning_opportunity}

上記のWHO/WHAT分析に基づいて、最も強力なBIG IDEAを生成してください。"""

    async def generate(self, who: WhoAnalysis, what: WhatAnalysis) -> BigIdea:
        """Generate BIG IDEA based on WHO and WHAT analysis."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(who, what)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,  # Slightly higher for creativity
            max_tokens=4096,
        )

        try:
            return BigIdea(**result)
        except Exception:
            return BigIdea(
                idea=result.get("idea", "BIG IDEA生成中にエラーが発生しました"),
                rationale=result.get("rationale", ""),
                evaluation=result.get("evaluation", {}),
                alternative_ideas=result.get("alternative_ideas", []),
            )
