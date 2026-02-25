"""STEP 2: Causality Analysis - 因果関係整理."""

from pathlib import Path

from app.models.schemas import BarrierAnalysis, CausalityResult
from app.services.llm import LLMService


class CausalityAnalyzer:
    """Analyzes causal relationships between barriers."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.prompt_path = Path(__file__).parent / "prompts" / "causality.txt"

    def _load_system_prompt(self) -> str:
        """Load the system prompt template."""
        return self.prompt_path.read_text(encoding="utf-8")

    def _build_user_prompt(self, barriers: BarrierAnalysis) -> str:
        """Build user prompt from barriers."""
        barrier_list = "\n".join(
            f"- ID {b.id}: [{b.category}] {b.barrier}"
            for b in barriers.barriers
        )
        return f"""## 障壁リスト

{barrier_list}

上記の障壁間の因果関係を50個程度整理し、つながりが多い重要な障壁を特定してください。"""

    async def analyze(self, barriers: BarrierAnalysis) -> CausalityResult:
        """Analyze causal relationships between barriers."""
        system_prompt = self._load_system_prompt()
        user_prompt = self._build_user_prompt(barriers)

        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=4096,
        )

        try:
            return CausalityResult(**result)
        except Exception:
            return CausalityResult(
                relations=result.get("relations", []),
                key_barriers=result.get("key_barriers", []),
            )
