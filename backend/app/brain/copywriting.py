"""Copywriting - コピーライティング."""

from pathlib import Path

from app.models.schemas import WhoAnalysis, WhatAnalysis, BigIdea, CopyOutput
from app.services.llm import LLMService


class CopyWriter:
    """Generates copy variations based on BIG IDEA."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "copy.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(
        self, big_idea: BigIdea, who: WhoAnalysis, what: WhatAnalysis
    ) -> str:
        """Build user prompt from BIG IDEA and analyses."""
        # Extract primary target
        primary_segment = next(
            (s for s in who.segments if s.priority == "primary"),
            who.segments[0] if who.segments else None
        )
        target_desc = primary_segment.description if primary_segment else "未指定"

        # Extract key insight
        key_insight = who.insights[0].insight if who.insights else "未指定"

        return f"""## BIG IDEA
{big_idea.idea}

### BIG IDEAの根拠
{big_idea.rationale}

## ターゲット
{target_desc}

## 核となるインサイト
{key_insight}

## 提供価値
- 機能的価値: {what.value_proposition.functional_value}
- 情緒的価値: {what.value_proposition.emotional_value}
- 社会的価値: {what.value_proposition.social_value}

## コア・バリュー・プロポジション
{what.value_proposition.core_proposition}

上記のBIG IDEAに基づいて、10本のコピー案を生成してください。
各案は異なるアングルやテクニックを使用し、多様性を持たせてください。"""

    async def write(
        self, big_idea: BigIdea, who: WhoAnalysis, what: WhatAnalysis
    ) -> CopyOutput:
        """Generate copy variations based on BIG IDEA."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(big_idea, who, what)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.9,  # Higher for creative diversity
            max_tokens=4096,
        )

        try:
            return CopyOutput(**result)
        except Exception:
            return CopyOutput(
                strategic_brief=result.get("strategic_brief", {}),
                variations=result.get("variations", []),
                recommended=result.get("recommended", 0),
                recommendation_reason=result.get("recommendation_reason", ""),
            )
