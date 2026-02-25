"""STEP 1: Barrier Analysis - 使わない理由分析."""

from pathlib import Path

from app.models.schemas import BarrierAnalysis, BriefInput
from app.services.llm import LLMService


class BarrierAnalyzer:
    """Analyzes barriers preventing product/service adoption."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "barriers.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(self, brief: BriefInput) -> str:
        """Build user prompt from brief."""
        return f"""## ブリーフ情報

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

**その他の情報**:
{brief.additional_info or "なし"}

上記に基づいて、この製品・サービスを使わない理由を30項目抽出してください。"""

    async def analyze(self, brief: BriefInput) -> BarrierAnalysis:
        """Analyze barriers for the given brief."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(brief)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        try:
            return BarrierAnalysis(**result)
        except Exception:
            # barriers が直接リストで返ってくる場合に対応
            if isinstance(result, list):
                return BarrierAnalysis(barriers=result)
            barriers = result.get("barriers", [])
            return BarrierAnalysis(barriers=barriers)
