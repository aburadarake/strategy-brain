"""Strategy Orchestrator — 一気通貫オーケストレーター.

実行フロー:
  [STEP0]  デスクリサーチ + インタビュー分析（並列）
  [別視点] 細田式3Dモデル（本筋と並列・独立）
  [本筋]   障壁分析STEP1-4
               ↓
            WHO / WHAT (並列)
               ↓
            BIG IDEA
               ↓
            コピー / 広告企画 (並列)

デスクリサーチ・インタビュー分析の結果はbrief.additional_infoに追記して後続ステップへ渡す。
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
    DeskResearchInput,
    DeskResearchResult,
    InterviewAnalysisInput,
    InterviewAnalysisResult,
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
from .desk_research import DeskResearcher
from .interview_analysis import InterviewAnalyzer


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
        self.desk_researcher = DeskResearcher(self.llm)
        self.interview_analyzer = InterviewAnalyzer(self.llm)

    # ── ヘルパー ──────────────────────────────────────────────────

    def _enrich_brief_with_research(
        self,
        brief: BriefInput,
        desk_research: DeskResearchResult | None = None,
        interview_analysis: InterviewAnalysisResult | None = None,
    ) -> BriefInput:
        """デスクリサーチ・インタビュー分析の結果をbrief.additional_infoに追記する。"""
        additions = []
        if desk_research and desk_research.stage1:
            s1 = desk_research.stage1
            blind_spot_titles = "; ".join(bs.title for bs in s1.blind_spots[:3])
            players = "; ".join(p.player_name for p in s1.player_communications[:3])
            additions.append(
                f"## デスクリサーチ結果\n"
                f"市場構造: {s1.market_structure}\n"
                f"主要プレイヤー: {players}\n"
                f"語られていない盲点: {blind_spot_titles}"
            )
        if interview_analysis:
            insights = "\n".join(
                f"- {i.insight_text}" for i in interview_analysis.insights[:3]
            )
            directions = "\n".join(
                f"- {d}" for d in interview_analysis.strategic_directions[:3]
            )
            additions.append(
                f"## インタビュー分析インサイト\n{insights}\n戦略示唆:\n{directions}"
            )
        if additions:
            base = brief.additional_info or ""
            enriched = base + "\n\n" + "\n\n".join(additions)
            return brief.model_copy(update={"additional_info": enriched})
        return brief

    def _build_desk_research_input(self, brief: BriefInput) -> DeskResearchInput:
        """briefinputからデスクリサーチ入力を構築する。"""
        category = f"{brief.product_name or ''} / {brief.product_description or ''}"
        context = "\n".join(filter(None, [
            brief.target_market,
            brief.current_situation,
            brief.competitors,
            brief.additional_info,
        ]))
        deep_dive_focus = brief.product_name or brief.brand_name or "購買障壁"
        return DeskResearchInput(
            category=category.strip(" /"),
            context=context[:3000],
            deep_dive_focus=deep_dive_focus,
        )

    def _should_run_interview(self, brief: BriefInput) -> bool:
        """インタビュー分析を実行すべきか判定する。"""
        text = brief.additional_info or ""
        return len(text) > 200

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

        STEP0: デスクリサーチ + インタビュー分析（並列）
        → brief を情報で強化
        → 細田式3D（別視点）と障壁分析を並列実行
        → WHO / WHAT → BIG IDEA → コピー / 広告企画
        """
        # ── STEP0: デスクリサーチ + インタビュー分析（並列）──────
        desk_research_input = self._build_desk_research_input(brief)
        run_interview = self._should_run_interview(brief)

        if run_interview:
            interview_input = InterviewAnalysisInput(
                transcript=brief.additional_info or "",
                research_goal=f"{brief.product_name or brief.brand_name}の購買障壁・インサイト解明",
                context=f"製品: {brief.product_name}\n概要: {brief.product_description or ''}",
            )
            desk_stage1, interview_result = await asyncio.gather(
                self.desk_researcher.research_stage1(desk_research_input),
                self.interview_analyzer.analyze(interview_input),
            )
        else:
            desk_stage1 = await self.desk_researcher.research_stage1(desk_research_input)
            interview_result = None

        desk_research_result = DeskResearchResult(
            category=desk_research_input.category,
            stage1=desk_stage1,
        )
        enriched_brief = self._enrich_brief_with_research(brief, desk_research_result, interview_result)

        # ── 細田式3D（別視点）と障壁分析を並列実行 ──────────────
        hosoda_3d, barriers = await asyncio.gather(
            self.analyze_hosoda_3d(enriched_brief),
            self.analyze_barriers(enriched_brief),
        )

        # ── 本筋: WHO / WHAT 並列 ────────────────────────────────
        who, what = await asyncio.gather(
            self.analyze_who(enriched_brief, barriers),
            self.analyze_what(enriched_brief, barriers),
        )

        # ── 本筋: BIG IDEA ────────────────────────────────────────
        big_idea = await self.generate_big_idea(who, what)

        # ── 本筋: コピー / 広告企画 並列 ─────────────────────────
        copy_result, ad_planning = await asyncio.gather(
            self.generate_copy(big_idea, who, what),
            self.generate_ad_planning(enriched_brief, who, what, big_idea),
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
            desk_research=desk_research_result,
            interview_analysis=interview_result,
        )

    # ── ストリーミング版 ─────────────────────────────────────────

    async def run_full_analysis_streaming(
        self, brief: BriefInput
    ) -> AsyncGenerator[dict, None]:
        """ストリーミング更新付きで完全な戦略立案を実行する。

        各 asyncio.gather() の待機中に keepalive を送り続け、
        Railway などのプロキシによるタイムアウトを防ぐ。
        """
        import asyncio as _asyncio

        yield {"step": "start", "message": "分析を開始します..."}

        # ── STEP0: デスクリサーチ + インタビュー分析（並列）──────
        yield {"step": "desk_research", "status": "running", "message": "デスクリサーチ（市場構造・競合分析）中..."}
        desk_research_input = self._build_desk_research_input(brief)
        run_interview = self._should_run_interview(brief)

        if run_interview:
            yield {"step": "interview_analysis", "status": "running", "message": "インタビュー・定性データ分析中..."}
            interview_input = InterviewAnalysisInput(
                transcript=brief.additional_info or "",
                research_goal=f"{brief.product_name or brief.brand_name}の購買障壁・インサイト解明",
                context=f"製品: {brief.product_name}\n概要: {brief.product_description or ''}",
            )
            step0_task = _asyncio.ensure_future(
                _asyncio.gather(
                    self.desk_researcher.research_stage1(desk_research_input),
                    self.interview_analyzer.analyze(interview_input),
                )
            )
            while not step0_task.done():
                await _asyncio.sleep(15)
                if not step0_task.done():
                    yield {"step": "keepalive", "status": "running", "message": "デスクリサーチ・インタビュー分析中..."}
            desk_stage1, interview_result = step0_task.result()
        else:
            step0_task = _asyncio.ensure_future(
                self.desk_researcher.research_stage1(desk_research_input)
            )
            while not step0_task.done():
                await _asyncio.sleep(15)
                if not step0_task.done():
                    yield {"step": "keepalive", "status": "running", "message": "デスクリサーチ中..."}
            desk_stage1 = step0_task.result()
            interview_result = None

        desk_research_result = DeskResearchResult(
            category=desk_research_input.category,
            stage1=desk_stage1,
        )
        yield {"step": "desk_research", "status": "complete", "data": desk_research_result.model_dump()}
        if interview_result:
            yield {"step": "interview_analysis", "status": "complete", "data": interview_result.model_dump()}

        enriched_brief = self._enrich_brief_with_research(brief, desk_research_result, interview_result)

        # ── 細田式3D（別視点）と障壁分析を並列起動 ──────────────
        yield {"step": "hosoda_3d", "status": "running", "message": "細田式3Dモデル（別視点）分析中..."}
        yield {"step": "barriers", "status": "running", "message": "障壁分析中..."}

        # keepalive を送りながら並列実行
        gather_task = _asyncio.ensure_future(
            _asyncio.gather(
                self.analyze_hosoda_3d(enriched_brief),
                self.analyze_barriers(enriched_brief),
            )
        )
        while not gather_task.done():
            await _asyncio.sleep(15)
            if not gather_task.done():
                yield {"step": "keepalive", "status": "running", "message": "障壁・3D分析中..."}
        hosoda_3d, barriers = gather_task.result()

        yield {"step": "hosoda_3d", "status": "complete", "data": hosoda_3d.model_dump()}
        yield {"step": "barriers", "status": "complete", "data": barriers.model_dump()}

        # ── WHO / WHAT 並列 ───────────────────────────────────────
        yield {"step": "who_what", "status": "running", "message": "WHO/WHAT分析中..."}

        who_what_task = _asyncio.ensure_future(
            _asyncio.gather(
                self.analyze_who(enriched_brief, barriers),
                self.analyze_what(enriched_brief, barriers),
            )
        )
        while not who_what_task.done():
            await _asyncio.sleep(15)
            if not who_what_task.done():
                yield {"step": "keepalive", "status": "running", "message": "WHO/WHAT分析中..."}
        who, what = who_what_task.result()

        yield {"step": "who", "status": "complete", "data": who.model_dump()}
        yield {"step": "what", "status": "complete", "data": what.model_dump()}

        # ── BIG IDEA ──────────────────────────────────────────────
        yield {"step": "bigidea", "status": "running", "message": "BIG IDEA生成中..."}

        bigidea_task = _asyncio.ensure_future(self.generate_big_idea(who, what))
        while not bigidea_task.done():
            await _asyncio.sleep(15)
            if not bigidea_task.done():
                yield {"step": "keepalive", "status": "running", "message": "BIG IDEA生成中..."}
        big_idea = bigidea_task.result()

        yield {"step": "bigidea", "status": "complete", "data": big_idea.model_dump()}

        # ── コピー / 広告企画 並列 ────────────────────────────────
        yield {"step": "copy", "status": "running", "message": "コピー・広告企画生成中..."}

        copy_task = _asyncio.ensure_future(
            _asyncio.gather(
                self.generate_copy(big_idea, who, what),
                self.generate_ad_planning(enriched_brief, who, what, big_idea),
            )
        )
        while not copy_task.done():
            await _asyncio.sleep(15)
            if not copy_task.done():
                yield {"step": "keepalive", "status": "running", "message": "コピー・広告企画生成中..."}
        copy_result, ad_planning = copy_task.result()

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
            desk_research=desk_research_result,
            interview_analysis=interview_result,
        )
        yield {"step": "complete", "message": "分析完了", "data": result.model_dump()}
