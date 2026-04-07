"""Vol.6 デスクリサーチ — 俯瞰マップ + 深掘り."""

from pathlib import Path

from app.models.schemas import (
    DeskResearchInput,
    DeskResearchResult,
    DeskResearchStage1,
    DeskResearchStage2,
    DeskResearchBlindSpot,
    DeskResearchDiscussionPoint,
    DeskResearchPlayerComm,
    DeskResearchHistoryStage,
    DeskResearchDisruptionPoint,
)
from app.services.llm import LLMService


class DeskResearcher:
    """2段階デスクリサーチを実行する."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.stage1_prompt_path = Path(__file__).parent / "prompts" / "desk_research.txt"
        self.stage2_prompt_path = Path(__file__).parent / "prompts" / "desk_research_deep.txt"

    def _build_stage1_prompt(self, input: DeskResearchInput) -> str:
        prompt = f"""## 対象カテゴリ
【業種・カテゴリ名】: {input.category}
"""
        if input.context:
            prompt += f"\n## 追加情報\n{input.context}\n"

        prompt += "\n上記のカテゴリについて、第1段階（俯瞰マップ）のデスクリサーチを行ってください。"
        return prompt

    def _build_stage2_prompt(self, input: DeskResearchInput, stage1_summary: str = "") -> str:
        prompt = f"""## 対象カテゴリ
{input.category}

## 深掘り対象
【深掘り対象】: {input.deep_dive_focus}
"""
        if stage1_summary:
            prompt += f"\n## 第1段階の調査結果（参考）\n{stage1_summary}\n"

        prompt += "\n上記の深掘り対象について、第2段階（深掘り）のデスクリサーチを行ってください。"
        return prompt

    async def research_stage1(self, input: DeskResearchInput) -> DeskResearchStage1:
        """第1段階: 俯瞰マップを生成する."""
        system_prompt = self.stage1_prompt_path.read_text(encoding="utf-8")
        user_prompt = self._build_stage1_prompt(input)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=8192,
        )

        blind_spots = [
            DeskResearchBlindSpot(**bs) if isinstance(bs, dict) else DeskResearchBlindSpot(title=str(bs), description="")
            for bs in result.get("blind_spots", [])
        ]
        discussion_points = [
            DeskResearchDiscussionPoint(**dp) if isinstance(dp, dict) else DeskResearchDiscussionPoint(title=str(dp), description="")
            for dp in result.get("discussion_points", [])
        ]
        player_comms = [
            DeskResearchPlayerComm(**pc) if isinstance(pc, dict) else DeskResearchPlayerComm(player_name=str(pc), ad_approach="", target_definition="", content_style="")
            for pc in result.get("player_communications", [])
        ]

        return DeskResearchStage1(
            market_structure=result.get("market_structure", ""),
            player_communications=player_comms,
            blind_spots=blind_spots,
            discussion_points=discussion_points,
        )

    async def research_stage2(self, input: DeskResearchInput, stage1: DeskResearchStage1 | None = None) -> DeskResearchStage2:
        """第2段階: 深掘り."""
        system_prompt = self.stage2_prompt_path.read_text(encoding="utf-8")
        stage1_summary = stage1.market_structure[:500] if stage1 else ""
        user_prompt = self._build_stage2_prompt(input, stage1_summary)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=6144,
        )

        history = [
            DeskResearchHistoryStage(**h) if isinstance(h, dict) else DeskResearchHistoryStage(period=str(h), description="", why_it_changed="")
            for h in result.get("history_stages", [])
        ]
        disruptions = [
            DeskResearchDisruptionPoint(**d) if isinstance(d, dict) else DeskResearchDisruptionPoint(title=str(d), description="", scenario="")
            for d in result.get("disruption_points", [])
        ]

        return DeskResearchStage2(
            focus=result.get("focus", input.deep_dive_focus),
            history_stages=history,
            disruption_points=disruptions,
            opportunities=result.get("opportunities", []),
        )

    async def research(self, input: DeskResearchInput) -> DeskResearchResult:
        """Stage1のみ実行（Stage2はdeep_dive_focusがある場合のみ）."""
        stage1 = await self.research_stage1(input)
        stage2 = None

        if input.deep_dive_focus:
            stage2 = await self.research_stage2(input, stage1)

        return DeskResearchResult(
            category=input.category,
            stage1=stage1,
            stage2=stage2,
        )
