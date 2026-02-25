"""細田式3Dモデル分析 — Doubt / Discover / Design.

本筋（WHO/WHAT/BIG IDEA/コピー）とは独立した「別視点の可能性分析」として機能する。
オーケストレーター側で並列実行し、メインフローへの干渉はない。
"""

from pathlib import Path

from app.models.schemas import (
    BriefInput,
    Hosoda3DResult,
    DoubtAnalysis,
    DoubtQuestion,
    DiscoverAnalysis,
    DesignAnalysis,
    DesignIdea,
)
from app.services.llm import LLMService


class Hosoda3DAnalyzer:
    """細田高広氏の3Dモデル（Doubt/Discover/Design）による課題リフレーミング分析."""

    SYSTEM_PROMPT = (
        "あなたは細田高広氏の3Dモデル（Doubt/Discover/Design）のスペシャリストです。"
        "ビジネス課題を人間の課題にリフレーミングし、凡庸な正解を超えた可能性を解放します。"
        "この分析はメインの戦略フロー（WHO/WHAT/BIG IDEA）とは独立した「別視点」として機能します。"
    )

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_template = self._load_prompt()

    def _load_prompt(self) -> str:
        prompt_path = Path(__file__).parent / "prompts" / "hosoda_3d.txt"
        return prompt_path.read_text(encoding="utf-8")

    def _build_prompt(self, brief: BriefInput) -> str:
        """ブリーフ情報をテンプレートに埋め込む（JSON内の{} と衝突しないよう replace を使用）。"""
        prompt = self.prompt_template
        prompt = prompt.replace("{product_name}", brief.product_name)
        prompt = prompt.replace("{product_description}", brief.product_description or "")
        prompt = prompt.replace("{objectives}", brief.objectives or "未設定")
        prompt = prompt.replace("{current_situation}", brief.current_situation or "未設定")
        prompt = prompt.replace("{target_market}", brief.target_market or "未設定")
        prompt = prompt.replace("{additional_info}", brief.additional_info or "なし")
        return prompt

    async def analyze(self, brief: BriefInput) -> Hosoda3DResult:
        """3Dモデルによる完全分析を実行（別視点分析 — 本筋フローに干渉しない）。"""
        prompt = self._build_prompt(brief)

        try:
            # generate_json() を使いJSON専用の指示を system に注入してパースまで行う
            data = await self.llm.generate_json(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.7,
                max_tokens=4096,
            )
        except Exception:
            data = self._fallback_structure(brief)

        try:
            return self._parse_result(data)
        except Exception:
            return self._parse_result(self._fallback_structure(brief))

    # ── パース ────────────────────────────────────────────────────

    def _parse_result(self, data: dict) -> Hosoda3DResult:
        doubt_data = data.get("doubt", {})
        discover_data = data.get("discover", {})
        design_data = data.get("design", {})

        doubt = self._parse_doubt(doubt_data)
        discover = self._parse_discover(discover_data)
        design = self._parse_design(design_data)

        return Hosoda3DResult(doubt=doubt, discover=discover, design=design)

    def _parse_doubt(self, data: dict) -> DoubtAnalysis:
        raw_questions = data.get("questions", [])
        questions: list[DoubtQuestion] = []
        for q in raw_questions:
            if isinstance(q, dict):
                questions.append(
                    DoubtQuestion(
                        angle=q.get("angle", ""),
                        question=q.get("question", ""),
                        insight=q.get("insight", ""),
                    )
                )
            elif isinstance(q, str):
                questions.append(DoubtQuestion(question=q, insight=""))

        return DoubtAnalysis(
            original_challenge=data.get("original_challenge", ""),
            questions=questions,
            hidden_assumptions=_ensure_str_list(data.get("hidden_assumptions", [])),
            average_answers=_ensure_str_list(data.get("average_answers", [])),
        )

    def _parse_discover(self, data: dict) -> DiscoverAnalysis:
        return DiscoverAnalysis(
            business_challenge=data.get("business_challenge", ""),
            human_challenge=data.get("human_challenge", ""),
            hidden_truth=data.get("hidden_truth", ""),
            possibility_to_unlock=data.get("possibility_to_unlock", ""),
            reframing_journey=data.get("reframing_journey", {}),
        )

    def _parse_design(self, data: dict) -> DesignAnalysis:
        raw_ideas = data.get("ideas", [])
        ideas: list[DesignIdea] = []
        for idea in raw_ideas:
            if isinstance(idea, dict):
                ideas.append(
                    DesignIdea(
                        concept=idea.get("concept", ""),
                        enables=idea.get("enables", ""),
                        why_not_average=idea.get("why_not_average", ""),
                        world_after=idea.get("world_after", ""),
                    )
                )

        return DesignAnalysis(
            ideas=ideas,
            recommended_idea=int(data.get("recommended_idea", 0)),
            recommendation_reason=data.get("recommendation_reason", ""),
        )

    # ── フォールバック ─────────────────────────────────────────────

    def _fallback_structure(self, brief: BriefInput) -> dict:
        """パース失敗時の最低限の構造。"""
        challenge = brief.objectives or brief.current_situation or "課題未設定"
        return {
            "doubt": {
                "original_challenge": challenge,
                "questions": [
                    {
                        "angle": "固定観念の破壊①",
                        "question": "この課題設定は本当に正しいのか？",
                        "insight": "課題の再検討が必要かもしれない",
                    }
                ],
                "hidden_assumptions": ["現状維持が前提になっている"],
                "average_answers": ["従来型のアプローチで解決しようとしている"],
            },
            "discover": {
                "business_challenge": challenge,
                "human_challenge": "なぜ人々は行動を変えないのか？",
                "hidden_truth": "人々は本当の価値にまだ気づいていない",
                "possibility_to_unlock": "新しい可能性の解放",
                "reframing_journey": {
                    "from": "ビジネス目標の達成",
                    "to": "人間の本質的ニーズの充足",
                    "because": "本当の価値は数字の先にある",
                },
            },
            "design": {
                "ideas": [
                    {
                        "concept": "可能性解放コンセプト",
                        "enables": "新しい体験を可能にする",
                        "why_not_average": "従来の発想を超えている",
                        "world_after": "より豊かな世界",
                    }
                ],
                "recommended_idea": 0,
                "recommendation_reason": "最も本質的なアプローチ",
            },
        }


# ── ユーティリティ ─────────────────────────────────────────────────

def _ensure_str_list(value: object) -> list[str]:
    """list[str] を保証する。単一 str なら 1 要素リストに変換。"""
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        return [value]
    return []
