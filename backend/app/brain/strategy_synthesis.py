"""WHY/WHO/WHAT/HOW 戦略合成モジュール."""

from pathlib import Path

from app.models.schemas import (
    StrategySynthesisInput,
    StrategySynthesisResult,
    WhyFrame,
    WhoFrame,
    WhatFrame,
    HowFrame,
)
from app.services.llm import LLMService


class StrategySynthesizer:
    """分析結果を WHY→WHO→WHAT→HOW の戦略フレームに合成する。"""

    def __init__(self, llm: LLMService):
        self.llm = llm
        self._system_prompt = (
            Path(__file__).parent / "prompts" / "strategy_synthesis.txt"
        ).read_text(encoding="utf-8")

    async def synthesize(self, input: StrategySynthesisInput) -> StrategySynthesisResult:
        user_prompt = self._build_prompt(input)
        raw = await self.llm.generate_json(self._system_prompt, user_prompt)
        return self._map(raw, input.product_name)

    def _build_prompt(self, input: StrategySynthesisInput) -> str:
        sections = [f"製品・サービス: {input.product_name}"]

        if input.research_findings:
            sections.append(f"## リサーチ結果（デスクリサーチ・SNSリスニング・インタビュー等）\n{input.research_findings}")
        if input.who_insights:
            sections.append(f"## WHO分析・ターゲットインサイト\n{input.who_insights}")
        if input.what_insights:
            sections.append(f"## WHAT分析・価値提案・BIG IDEA\n{input.what_insights}")
        if input.how_insights:
            sections.append(f"## HOW分析・広告企画・コミュニケーション施策\n{input.how_insights}")
        if input.additional_context:
            sections.append(f"## 補足情報\n{input.additional_context}")

        return "\n\n".join(sections)

    def _map(self, raw: dict, product_name: str) -> StrategySynthesisResult:
        def _s(obj: object, key: str) -> str:
            return str(obj.get(key, "")) if isinstance(obj, dict) else ""  # type: ignore[union-attr]

        def _list(obj: object, key: str) -> list[str]:
            if not isinstance(obj, dict):
                return []
            v = obj.get(key, [])
            if isinstance(v, list):
                return [str(x) for x in v]
            return [str(v)] if v else []

        why_data = raw.get("why", {})
        who_data = raw.get("who", {})
        what_data = raw.get("what", {})
        how_data = raw.get("how", {})

        return StrategySynthesisResult(
            product_name=product_name,
            strategy_headline=str(raw.get("strategy_headline", "")),
            why=WhyFrame(
                core_tension=_s(why_data, "core_tension"),
                cultural_context=_s(why_data, "cultural_context"),
                brand_opportunity=_s(why_data, "brand_opportunity"),
                statement=_s(why_data, "statement"),
            ),
            who=WhoFrame(
                primary_target=_s(who_data, "primary_target"),
                mindset=_s(who_data, "mindset"),
                key_tension=_s(who_data, "key_tension"),
                statement=_s(who_data, "statement"),
            ),
            what=WhatFrame(
                core_message=_s(what_data, "core_message"),
                brand_role=_s(what_data, "brand_role"),
                value_promise=_s(what_data, "value_promise"),
                statement=_s(what_data, "statement"),
            ),
            how=HowFrame(
                communication_approach=_s(how_data, "communication_approach"),
                key_tactics=_list(how_data, "key_tactics"),
                tone_manner=_s(how_data, "tone_manner"),
                statement=_s(how_data, "statement"),
            ),
            strategy_statement=str(raw.get("strategy_statement", "")),
        )
