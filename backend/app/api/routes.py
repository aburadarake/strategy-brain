"""API Routes for Strategy Brain."""

import json
from typing import Literal

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from sse_starlette.sse import EventSourceResponse

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
    EvaluationInput,
    EvaluationResult,
    DeskResearchInput,
    DeskResearchResult,
    DeskResearchStage2,
    SocialListeningInput,
    SocialListeningResult,
    InterviewAnalysisInput,
    InterviewAnalysisResult,
    StrategySynthesisInput,
    StrategySynthesisResult,
)
from app.brain.orchestrator import StrategyOrchestrator
from app.brain.evaluation import PlanEvaluator
from app.brain.desk_research import DeskResearcher
from app.brain.social_listening import SocialListeningAnalyzer
from app.brain.interview_analysis import InterviewAnalyzer
from app.brain.strategy_synthesis import StrategySynthesizer
from app.services.file_processor import file_processor
from app.services.llm import get_llm_service

router = APIRouter()


def get_orchestrator() -> StrategyOrchestrator:
    """Get orchestrator instance."""
    return StrategyOrchestrator()


@router.post("/analyze", response_model=StrategyResult)
async def analyze_full(brief: BriefInput) -> StrategyResult:
    """
    Run complete strategy analysis.

    This endpoint runs the full analysis pipeline:
    1. Barrier Analysis (STEP 1-4)
    2. WHO Analysis
    3. WHAT Analysis
    4. BIG IDEA Generation
    5. Copywriting (10 variations)
    """
    try:
        orchestrator = get_orchestrator()
        result = await orchestrator.run_full_analysis(brief)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/with-files", response_model=StrategyResult)
async def analyze_with_files(
    product_name: str = Form(...),
    product_description: str = Form(default=""),
    target_market: str = Form(""),
    current_situation: str = Form(""),
    objectives: str = Form(""),
    competitors: str = Form(""),
    additional_info: str = Form(""),
    files: list[UploadFile] = File(default=[]),
) -> StrategyResult:
    """
    Run complete strategy analysis with file attachments.

    Accepts file uploads (PDF, Word, Excel, TXT, etc.) that will be
    analyzed and incorporated into the strategy planning process.
    """
    try:
        # Process uploaded files
        files_data = []
        for file in files:
            if file.filename:
                content = await file.read()
                file_data = await file_processor.process_file(file.filename, content)
                files_data.append(file_data)

        # If files were uploaded, analyze them and add to additional_info
        file_summary = ""
        if files_data:
            llm_service = get_llm_service()
            file_summary = await file_processor.summarize_files(files_data, llm_service)

        # Combine additional info with file analysis
        combined_additional = additional_info
        if file_summary:
            combined_additional += f"\n\n## 添付ファイル分析結果\n{file_summary}"

        # Create brief with file analysis included
        brief = BriefInput(
            product_name=product_name,
            product_description=product_description,
            target_market=target_market,
            current_situation=current_situation,
            objectives=objectives,
            competitors=competitors,
            additional_info=combined_additional,
        )

        orchestrator = get_orchestrator()
        result = await orchestrator.run_full_analysis(brief)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/files/analyze")
async def analyze_files(files: list[UploadFile] = File(...)) -> dict:
    """
    Analyze uploaded files and extract key information.

    Returns extracted text and a summary of the contents.
    """
    try:
        files_data = []
        for file in files:
            if file.filename:
                content = await file.read()
                file_data = await file_processor.process_file(file.filename, content)
                files_data.append(file_data)

        # Generate summary
        llm_service = get_llm_service()
        summary = await file_processor.summarize_files(files_data, llm_service)

        return {
            "files": [
                {
                    "filename": f["filename"],
                    "file_type": f["file_type"],
                    "char_count": f["char_count"],
                }
                for f in files_data
            ],
            "summary": summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/stream")
async def analyze_full_stream(brief: BriefInput):
    """
    Run complete strategy analysis with Server-Sent Events streaming.

    Returns progress updates as each step completes.
    """

    async def event_generator():
        try:
            orchestrator = get_orchestrator()
            async for update in orchestrator.run_full_analysis_streaming(brief):
                yield {
                    "event": update.get("step", "update"),
                    "data": json.dumps(update, ensure_ascii=False),
                }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator())


@router.post("/barriers", response_model=BarrierResult)
async def analyze_barriers(brief: BriefInput) -> BarrierResult:
    """
    Run barrier analysis only (STEP 1-4).

    Returns:
    - Barrier list (30 items)
    - Causal relationships
    - ABC classification
    - Mermaid diagram
    """
    try:
        orchestrator = get_orchestrator()
        return await orchestrator.analyze_barriers(brief)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/who", response_model=WhoAnalysis)
async def analyze_who(brief: BriefInput) -> WhoAnalysis:
    """
    Run WHO analysis only.

    Returns:
    - Core target analysis
    - Target segmentation
    - Consumer insights
    - Unmet needs
    """
    try:
        orchestrator = get_orchestrator()
        return await orchestrator.analyze_who(brief)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/what", response_model=WhatAnalysis)
async def analyze_what(brief: BriefInput) -> WhatAnalysis:
    """
    Run WHAT analysis only.

    Returns:
    - Market analysis
    - Brand diagnosis
    - Barrier strategies
    - Value proposition
    - Differentiation factors
    """
    try:
        orchestrator = get_orchestrator()
        return await orchestrator.analyze_what(brief)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BigIdeaRequest(BriefInput):
    """Request for BIG IDEA generation with optional pre-analyzed data."""

    who: WhoAnalysis | None = None
    what: WhatAnalysis | None = None


@router.post("/bigidea", response_model=BigIdea)
async def generate_big_idea(request: BigIdeaRequest) -> BigIdea:
    """
    Generate BIG IDEA.

    If WHO and WHAT analyses are not provided, they will be run first.

    Returns:
    - BIG IDEA
    - Rationale
    - 5-criteria evaluation
    - Alternative ideas
    """
    try:
        orchestrator = get_orchestrator()

        # Run WHO and WHAT if not provided
        brief = BriefInput(**request.model_dump(exclude={"who", "what"}))

        if request.who and request.what:
            who = request.who
            what = request.what
        else:
            import asyncio

            who, what = await asyncio.gather(
                orchestrator.analyze_who(brief),
                orchestrator.analyze_what(brief),
            )

        return await orchestrator.generate_big_idea(who, what)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CopyRequest(BriefInput):
    """Request for copywriting with optional pre-analyzed data."""

    who: WhoAnalysis | None = None
    what: WhatAnalysis | None = None
    big_idea: BigIdea | None = None


@router.post("/copy", response_model=CopyOutput)
async def generate_copy(request: CopyRequest) -> CopyOutput:
    """
    Generate copy variations.

    If required analyses are not provided, they will be run first.

    Returns:
    - Strategic brief
    - 10 copy variations
    - Recommended variation with reason
    """
    try:
        orchestrator = get_orchestrator()

        brief = BriefInput(**request.model_dump(exclude={"who", "what", "big_idea"}))

        # Run analyses if not provided
        if request.who and request.what:
            who = request.who
            what = request.what
        else:
            import asyncio

            who, what = await asyncio.gather(
                orchestrator.analyze_who(brief),
                orchestrator.analyze_what(brief),
            )

        if request.big_idea:
            big_idea = request.big_idea
        else:
            big_idea = await orchestrator.generate_big_idea(who, what)

        return await orchestrator.generate_copy(big_idea, who, what)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AdPlanRequest(BriefInput):
    """Request for ad planning with optional pre-analyzed data."""

    who: WhoAnalysis | None = None
    what: WhatAnalysis | None = None
    big_idea: BigIdea | None = None


@router.post("/ad-planning", response_model=AdPlanResult)
async def generate_ad_planning(request: AdPlanRequest) -> AdPlanResult:
    """
    Generate 6 advertising plans using different ideation methods.

    Returns:
    - Brand concept
    - New perspectives (5+)
    - 6 ad plans (OOH copies, SNS posts, experiential tactics)
    - Recommended plan
    """
    try:
        orchestrator = get_orchestrator()

        brief = BriefInput(**request.model_dump(exclude={"who", "what", "big_idea"}))

        import asyncio

        if request.who and request.what:
            who = request.who
            what = request.what
        else:
            who, what = await asyncio.gather(
                orchestrator.analyze_who(brief),
                orchestrator.analyze_what(brief),
            )

        if request.big_idea:
            big_idea = request.big_idea
        else:
            big_idea = await orchestrator.generate_big_idea(who, what)

        return await orchestrator.generate_ad_planning(brief, who, what, big_idea)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_providers() -> dict:
    """Get available LLM providers and current setting."""
    from app.config import get_settings

    settings = get_settings()
    return {
        "available": ["openai", "anthropic"],
        "current": settings.llm_provider,
        "models": {
            "openai": settings.openai_model,
            "anthropic": settings.anthropic_model,
        },
    }


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_plan(input: EvaluationInput) -> EvaluationResult:
    """
    Vol.5: 企画を5軸でスコアリング評価する。

    5軸:
    1. 目的適合性 (Goal Alignment)
    2. 実現可能性 (Feasibility)
    3. 市場優位性 (Competitive Advantage)
    4. 論理的整合性 (Logical Soundness)
    5. 創造的飛躍 (Creative Inspiration)
    """
    try:
        llm_service = get_llm_service()
        evaluator = PlanEvaluator(llm_service)
        return await evaluator.evaluate(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/desk-research", response_model=DeskResearchResult)
async def desk_research(input: DeskResearchInput) -> DeskResearchResult:
    """
    Vol.6: AIデスクリサーチ — 俯瞰マップ（+ オプションで深掘り）。

    deep_dive_focus が入力された場合、第2段階の深掘りも実行する。
    """
    try:
        llm_service = get_llm_service()
        researcher = DeskResearcher(llm_service)
        return await researcher.research(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/desk-research/deep-dive", response_model=DeskResearchStage2)
async def desk_research_deep_dive(input: DeskResearchInput) -> DeskResearchStage2:
    """
    Vol.6: デスクリサーチ第2段階のみ実行（深掘り）。

    deep_dive_focus に深掘り対象を指定すること。
    """
    try:
        llm_service = get_llm_service()
        researcher = DeskResearcher(llm_service)
        return await researcher.research_stage2(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social-listening", response_model=SocialListeningResult)
async def social_listening(input: SocialListeningInput) -> SocialListeningResult:
    """
    Vol.7: ソーシャルリスニング分析。

    SNS投稿データ（Grok等で収集）を貼り付けてインサイトを抽出する。
    sns_data が空の場合はカテゴリの一般的な傾向から推測する。
    """
    try:
        llm_service = get_llm_service()
        analyzer = SocialListeningAnalyzer(llm_service)
        return await analyzer.analyze(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview-analysis", response_model=InterviewAnalysisResult)
async def interview_analysis(input: InterviewAnalysisInput) -> InterviewAnalysisResult:
    """
    Vol.8: インタビュー分析 — 文字起こしを構造化分析する。

    インタビュー発話録をAIで構造化し、インサイトを抽出する。
    """
    try:
        llm_service = get_llm_service()
        analyzer = InterviewAnalyzer(llm_service)
        return await analyzer.analyze(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/strategy-synthesis", response_model=StrategySynthesisResult)
async def strategy_synthesis(input: StrategySynthesisInput) -> StrategySynthesisResult:
    """
    WHY/WHO/WHAT/HOW 戦略合成。

    各種分析結果（デスクリサーチ、SNSリスニング、インタビュー分析、WHO/WHAT/BIG IDEAなど）を
    入力として、WHY → WHO → WHAT → HOW の4層からなる戦略フレームに統合する。
    """
    try:
        llm_service = get_llm_service()
        synthesizer = StrategySynthesizer(llm_service)
        return await synthesizer.synthesize(input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/provider")
async def set_provider(provider: Literal["openai", "anthropic"]) -> dict:
    """
    Set the LLM provider for subsequent requests.

    Note: This only affects the current session.
    For persistent changes, modify the .env file.
    """
    from app.config import get_settings

    settings = get_settings()
    # Note: This is a simplified implementation
    # In production, you'd want proper state management
    settings.llm_provider = provider
    return {"status": "ok", "provider": provider}
