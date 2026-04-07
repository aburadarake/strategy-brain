"""Vol.8 定性調査 — インタビュー分析."""

from pathlib import Path

from app.models.schemas import (
    InterviewAnalysisInput,
    InterviewAnalysisResult,
    InterviewKeyStatement,
    InterviewPattern,
    InterviewInsight,
)
from app.services.llm import LLMService


class InterviewAnalyzer:
    """インタビュー文字起こしを構造化分析する."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "interview_analysis.txt"

    def _build_user_prompt(self, input: InterviewAnalysisInput) -> str:
        prompt = f"""## 調査目的
{input.research_goal}
"""
        if input.context:
            prompt += f"\n## 調査背景・コンテキスト\n{input.context}\n"

        prompt += f"""
## インタビュー発話録
---
{input.transcript}
---

上記のインタビュー発話録を分析し、インサイトを抽出してください。
"""
        return prompt

    async def analyze(self, input: InterviewAnalysisInput) -> InterviewAnalysisResult:
        """インタビュー発話録を分析する."""
        system_prompt = self.prompt_path.read_text(encoding="utf-8")
        user_prompt = self._build_user_prompt(input)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.6,
            max_tokens=8192,
        )

        key_statements = []
        for s in result.get("key_statements", []):
            if isinstance(s, dict):
                key_statements.append(InterviewKeyStatement(
                    content=s.get("content", ""),
                    type=s.get("type", "事実"),
                    significance=s.get("significance", ""),
                ))

        patterns = []
        for p in result.get("patterns", []):
            if isinstance(p, dict):
                patterns.append(InterviewPattern(
                    pattern_type=p.get("pattern_type", "共通"),
                    title=p.get("title", ""),
                    description=p.get("description", ""),
                    supporting_quotes=p.get("supporting_quotes", []),
                ))

        insights = []
        for i in result.get("insights", []):
            if isinstance(i, dict):
                insights.append(InterviewInsight(
                    insight_text=i.get("insight_text", ""),
                    tension=i.get("tension", ""),
                    opportunity=i.get("opportunity", ""),
                ))

        return InterviewAnalysisResult(
            research_goal=input.research_goal,
            key_statements=key_statements,
            patterns=patterns,
            insights=insights,
            strategic_directions=result.get("strategic_directions", []),
        )
