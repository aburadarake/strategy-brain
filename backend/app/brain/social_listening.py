"""Vol.7 ソーシャルリスニング分析."""

from pathlib import Path

from app.models.schemas import (
    SocialListeningInput,
    SocialListeningResult,
    SocialPattern,
    SocialInsightCategory,
)
from app.services.llm import LLMService


class SocialListeningAnalyzer:
    """SNS投稿データからインサイトを抽出する."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "social_listening.txt"

    def _build_user_prompt(self, input: SocialListeningInput) -> str:
        prompt = f"""## 対象ブランド・カテゴリ
{input.brand_category}
"""
        if input.sns_data:
            prompt += f"""
## SNS投稿データ
---
{input.sns_data}
---
"""
        else:
            prompt += "\n※ SNS投稿データが未入力のため、カテゴリの一般的な傾向から分析を推測してください。\n"

        if input.context:
            prompt += f"\n## 追加コンテキスト\n{input.context}\n"

        prompt += "\n上記を分析し、ソーシャルリスニング結果を出力してください。"
        return prompt

    async def analyze(self, input: SocialListeningInput) -> SocialListeningResult:
        """SNS投稿データを分析する."""
        system_prompt = self.prompt_path.read_text(encoding="utf-8")
        user_prompt = self._build_user_prompt(input)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=8192,
        )

        patterns = []
        for p in result.get("patterns", []):
            if isinstance(p, dict):
                patterns.append(SocialPattern(
                    pattern_name=p.get("pattern_name", ""),
                    description=p.get("description", ""),
                    volume=p.get("volume", "中程度"),
                    sentiment=p.get("sentiment", "ニュートラル"),
                    tone=p.get("tone", "情報共有"),
                    examples=p.get("examples", []),
                ))

        insight_categories = []
        for ic in result.get("insight_categories", []):
            if isinstance(ic, dict):
                insight_categories.append(SocialInsightCategory(
                    category_name=ic.get("category_name", ""),
                    consumer_voice=ic.get("consumer_voice", ""),
                    description=ic.get("description", ""),
                    volume=ic.get("volume", "中程度"),
                    key_insight=ic.get("key_insight", ""),
                ))

        return SocialListeningResult(
            brand_category=input.brand_category,
            patterns=patterns,
            insight_categories=insight_categories,
            untold_areas=result.get("untold_areas", []),
            strategic_directions=result.get("strategic_directions", []),
        )
