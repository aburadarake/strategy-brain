"""WHO Analysis - ターゲット消費者分析."""

from pathlib import Path

from app.models.schemas import BriefInput, BarrierResult, WhoAnalysis
from app.services.llm import LLMService


class WhoAnalyzer:
    """Analyzes target consumers (WHO)."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "who.txt"

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
            # Add barrier insights
            key_barriers = [
                b for b in barriers.barriers.barriers
                if b.id in barriers.causality.key_barriers
            ]
            if key_barriers:
                prompt += "\n## 重要な障壁（障壁分析より）\n"
                for b in key_barriers:
                    prompt += f"- {b.barrier}\n"

        prompt += "\n上記に基づいて、WHO分析を行ってください。"
        return prompt

    async def analyze(
        self, brief: BriefInput, barriers: BarrierResult | None = None
    ) -> WhoAnalysis:
        """Analyze target consumers."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(brief, barriers)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        try:
            return WhoAnalysis(**result)
        except Exception:
            return WhoAnalysis(
                core_target=result.get("core_target", {}),
                segments=result.get("segments", []),
                insights=result.get("insights", []),
                unmet_needs=result.get("unmet_needs", []),
            )
