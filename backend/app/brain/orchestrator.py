"""Strategy Orchestrator — 一気通貫オーケストレーター.

実行フロー:
  [別視点分析] 細田式3Dモデル  ←── 本筋フローと並列・独立
  [本筋]       障壁分析STEP1-4
                  ↓
               WHO / WHAT (並列)
                  ↓
               BIG IDEA
                  ↓
               コピー / 広告企画 (並列)

細田式3Dモデルは本筋（WHO/WHAT/BIG IDEA/コピー）へ一切影響しない。
"""

import asyncio
from typing import AsyncGenerator

from app.models.schemas import (
    BriefInput,
    BarrierResult,
    WhoAnalysis,
    WhatAnalysis,
    BigIdea,
    CopyOutput,
    StrategyResult,
    Hosoda3DResult,
    AdPlanResult,
)
from app.services.llm import LLMService
from .step1_barriers import BarrierAnalyzer
from .step2_causality import CausalityAnalyzer
from .step3_classify import ABCClassifier
from .step4_visualize import MermaidVisualizer
from .who_analysis import WhoAnalyzer
from .what_analysis import WhatAnalyzer
from .big_idea import BigIdeaGenerator
from .copywriting import CopyWriter
from .hosoda_3d import Hosoda3DAnalyzer
from .ad_planning import AdPlanGenerator


class StrategyOrchestrator:
    """Orchestrates the complete strategy planning process."""

    def __init__(self, llm_service: LLMService | None = None):
        from app.services import get_llm_service

        self.llm = llm_service or get_llm_service()

        self.hosoda_3d_analyzer = Hosoda3DAnalyzer(self.llm)
        self.barrier_analyzer = BarrierAnalyzer(self.llm)
        self.causality_analyzer = CausalityAnalyzer(self.llm)
        self.abc_classifier = ABCClassifier(self.llm)
        self.mermaid_visualizer = MermaidVisualizer()
        self.who_analyzer = WhoAnalyzer(self.llm)
        self.what_analyzer = WhatAnalyzer(self.llm)
        self.big_idea_generator = BigIdeaGenerator(self.llm)
        self.copy_writer = CopyWriter(self.llm)
        self.ad_plan_generator = AdPlanGenerator(self.llm)

    # ── 個別ステップ ─────────────────────────────────────────────

    async def analyze_hosoda_3d(self, brief: BriefInput) -> Hosoda3DResult:
        """細田式3Dモデル分析（別視点分析 — 本筋フローに影響しない）。"""
        return await self.hosoda_3d_analyzer.analyze(brief)

    async def analyze_barriers(self, brief: BriefInput) -> BarrierResult:
        """STEP 1-4: 障壁分析の完全実行。"""
        barriers = await self.barrier_analyzer.analyze(brief)
        causality = await self.causality_analyzer.analyze(barriers)
        classification = await self.abc_classifier.classify(barriers, causality)
        mermaid_diagram = self.mermaid_visualizer.generate(barriers, causality, classification)
        return BarrierResult(
            barriers=barriers,
            causality=causality,
            classification=classification,
            mermaid_diagram=mermaid_diagram,
        )

    async def analyze_who(
        self, brief: BriefInput, barriers: BarrierResult | None = None
    ) -> WhoAnalysis:
        return await self.who_analyzer.analyze(brief, barriers)

    async def analyze_what(
        self, brief: BriefInput, barriers: BarrierResult | None = None
    ) -> WhatAnalysis:
        return await self.what_analyzer.analyze(brief, barriers)

    async def generate_big_idea(self, who: WhoAnalysis, what: WhatAnalysis) -> BigIdea:
        return await self.big_idea_generator.generate(who, what)

    async def generate_copy(
        self, big_idea: BigIdea, who: WhoAnalysis, what: WhatAnalysis
    ) -> CopyOutput:
        return await self.copy_writer.write(big_idea, who, what)

    async def generate_ad_planning(
        self, brief: BriefInput, who: WhoAnalysis, what: WhatAnalysis, big_idea: BigIdea
    ) -> AdPlanResult:
        return await self.ad_plan_generator.generate(brief, who, what, big_idea)

    # ── フル分析 ─────────────────────────────────────────────────

    async def run_full_analysis(self, brief: BriefInput) -> StrategyResult:
        """完全な戦略立案プロセスを実行する。

        細田式3Dモデル（別視点）と障壁分析（本筋の出発点）を並列起動し、
        3Dモデルの結果は本筋の後続ステップへ一切渡さない。
        """
        # ── 細田式3D（別視点）と障壁分析を並列実行 ──────────────
        hosoda_3d, barriers = await asyncio.gather(
            self.analyze_hosoda_3d(brief),
            self.analyze_barriers(brief),
        )

        # ── 本筋: WHO / WHAT 並列 ────────────────────────────────
        who, what = await asyncio.gather(
            self.analyze_who(brief, barriers),
            self.analyze_what(brief, barriers),
        )

        # ── 本筋: BIG IDEA ────────────────────────────────────────
        big_idea = await self.generate_big_idea(who, what)

        # ── 本筋: コピー / 広告企画 並列 ─────────────────────────
        copy_result, ad_planning = await asyncio.gather(
            self.generate_copy(big_idea, who, what),
            self.generate_ad_planning(brief, who, what, big_idea),
        )

        return StrategyResult(
            brief=brief,
            hosoda_3d=hosoda_3d,
            barriers=barriers,
            who=who,
            what=what,
            big_idea=big_idea,
            copywriting=copy_result,
            ad_planning=ad_planning,
        )

    # ── ストリーミング版 ─────────────────────────────────────────

    async def run_full_analysis_streaming(
        self, brief: BriefInput
    ) -> AsyncGenerator[dict, None]:
        """ストリーミング更新付きで完全な戦略立案を実行する。"""
        yield {"step": "start", "message": "分析を開始します..."}

        # ── 細田式3D（別視点）と障壁分析を並列起動 ──────────────
        yield {"step": "hosoda_3d", "status": "running", "message": "細田式3Dモデル（別視点）分析中..."}
        yield {"step": "barriers", "status": "running", "message": "障壁分析中..."}

        hosoda_3d, barriers = await asyncio.gather(
            self.analyze_hosoda_3d(brief),
            self.analyze_barriers(brief),
        )

        yield {"step": "hosoda_3d", "status": "complete", "data": hosoda_3d.model_dump()}
        yield {"step": "barriers", "status": "complete", "data": barriers.model_dump()}

        # ── WHO / WHAT 並列 ───────────────────────────────────────
        yield {"step": "who_what", "status": "running", "message": "WHO/WHAT分析中..."}
        who, what = await asyncio.gather(
            self.analyze_who(brief, barriers),
            self.analyze_what(brief, barriers),
        )
        yield {"step": "who", "status": "complete", "data": who.model_dump()}
        yield {"step": "what", "status": "complete", "data": what.model_dump()}

        # ── BIG IDEA ──────────────────────────────────────────────
        yield {"step": "bigidea", "status": "running", "message": "BIG IDEA生成中..."}
        big_idea = await self.generate_big_idea(who, what)
        yield {"step": "bigidea", "status": "complete", "data": big_idea.model_dump()}

        # ── コピー / 広告企画 並列 ────────────────────────────────
        yield {"step": "copy", "status": "running", "message": "コピー・広告企画生成中..."}
        copy_result, ad_planning = await asyncio.gather(
            self.generate_copy(big_idea, who, what),
            self.generate_ad_planning(brief, who, what, big_idea),
        )
        yield {"step": "copy", "status": "complete", "data": copy_result.model_dump()}
        yield {"step": "ad_planning", "status": "complete", "data": ad_planning.model_dump()}

        # ── 完了 ──────────────────────────────────────────────────
        result = StrategyResult(
            brief=brief,
            hosoda_3d=hosoda_3d,
            barriers=barriers,
            who=who,
            what=what,
            big_idea=big_idea,
            copywriting=copy_result,
            ad_planning=ad_planning,
        )
        yield {"step": "complete", "message": "分析完了", "data": result.model_dump()}
