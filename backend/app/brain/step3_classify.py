"""STEP 3: ABC Classification - ABC分類."""

from pathlib import Path

from app.models.schemas import BarrierAnalysis, CausalityResult, ABCClassification
from app.services.llm import LLMService


class ABCClassifier:
    """Classifies barriers into A, B, C categories."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "classify.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(
        self, barriers: BarrierAnalysis, causality: CausalityResult
    ) -> str:
        """Build user prompt from barriers and causality."""
        barrier_list = "\n".join(
            f"- ID {b.id}: [{b.category}] {b.barrier}"
            for b in barriers.barriers
        )
        key_barriers = ", ".join(str(id) for id in causality.key_barriers)

        return f"""## 障壁リスト

{barrier_list}

## 重要な障壁（つながりが多いもの）
ID: {key_barriers}

上記の障壁をABC分類し、それぞれの解決アプローチを提案してください。"""

    async def classify(
        self, barriers: BarrierAnalysis, causality: CausalityResult
    ) -> ABCClassification:
        """Classify barriers into A, B, C categories."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(barriers, causality)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        try:
            return ABCClassification(**result)
        except Exception:
            return ABCClassification(
                a_items=result.get("a_items", []),
                b_items=result.get("b_items", []),
                c_items=result.get("c_items", []),
            )
