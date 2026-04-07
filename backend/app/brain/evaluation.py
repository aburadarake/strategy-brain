"""Vol.5 企画評価 — 5軸スコアリング."""

from pathlib import Path

from app.models.schemas import EvaluationInput, EvaluationResult, EvaluationAxisScore
from app.services.llm import LLMService


class PlanEvaluator:
    """5軸で企画を評価する."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "evaluation.txt"

    def _load_system_prompt(self) -> str:
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(self, input: EvaluationInput) -> str:
        prompt = f"""## 企画内容

{input.plan_content}
"""
        if input.context:
            prompt += f"\n## 背景情報・コンテキスト\n{input.context}\n"

        if input.balance_priority:
            prompt += f"\n## 重視するバランス（評価スタンス）\n{input.balance_priority}\n"
        else:
            prompt += "\n## 重視するバランス\nバランス重視で評価してください。\n"

        prompt += "\n上記に基づいて、5軸評価を行ってください。"
        return prompt

    async def evaluate(self, input: EvaluationInput) -> EvaluationResult:
        """企画を5軸で評価する."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(input)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.5,
            max_tokens=4096,
        )

        def parse_axis(data: dict) -> EvaluationAxisScore:
            return EvaluationAxisScore(
                score=data.get("score", 5),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                improvement=data.get("improvement", ""),
            )

        try:
            return EvaluationResult(
                plan_title=result.get("plan_title", "企画評価"),
                goal_alignment=parse_axis(result.get("goal_alignment", {})),
                feasibility=parse_axis(result.get("feasibility", {})),
                competitive_advantage=parse_axis(result.get("competitive_advantage", {})),
                logical_soundness=parse_axis(result.get("logical_soundness", {})),
                creative_inspiration=parse_axis(result.get("creative_inspiration", {})),
                total_score=result.get("total_score", 0),
                summary=result.get("summary", ""),
                strategic_advice=result.get("strategic_advice", ""),
                layer_evaluation=result.get("layer_evaluation", ""),
            )
        except Exception:
            return EvaluationResult(
                plan_title=result.get("plan_title", "企画評価"),
                goal_alignment=EvaluationAxisScore(score=5, strengths=[], weaknesses=[], improvement=""),
                feasibility=EvaluationAxisScore(score=5, strengths=[], weaknesses=[], improvement=""),
                competitive_advantage=EvaluationAxisScore(score=5, strengths=[], weaknesses=[], improvement=""),
                logical_soundness=EvaluationAxisScore(score=5, strengths=[], weaknesses=[], improvement=""),
                creative_inspiration=EvaluationAxisScore(score=5, strengths=[], weaknesses=[], improvement=""),
                total_score=25,
                summary=result.get("summary", ""),
                strategic_advice=result.get("strategic_advice", ""),
                layer_evaluation=result.get("layer_evaluation", ""),
            )
