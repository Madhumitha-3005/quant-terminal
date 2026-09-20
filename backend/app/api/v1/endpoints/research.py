import logging
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class ResearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    backtest_results: Dict[str, Any] = Field(default_factory=dict)
    symbol: Optional[str] = Field(default=None, max_length=20)


class ResearchResponse(BaseModel):
    answer: str
    model: str


async def generate_ai_answer(question: str, symbol: Optional[str], context: Dict[str, Any]) -> ResearchResponse:
    """Shared Featherless call used by chat and report generation."""
    if not settings.FEATHERLESS_API_KEY:
        raise HTTPException(status_code=503, detail="FEATHERLESS_API_KEY is not configured")

    messages = [
        {
            "role": "system",
            "content": (
                "You are a quantitative research assistant. Analyze only the supplied backtest "
                "results and quote the actual metric values when explaining them. For each answer, "
                "state the relevant metric, supporting evidence from the supplied bars or analysis "
                "period, and a limitation. Never invent causes, data, or performance. Do not present "
                "historical performance as a guarantee of future returns. Keep answers concise and practical."
            ),
        },
        {"role": "user", "content": f"Question: {question}\n\nCurrent backtest context:\n{{'symbol': {symbol}, 'data': {context}}}"},
    ]
    url = f"{settings.FEATHERLESS_API_BASE_URL.rstrip('/')}/chat/completions"
    payload = {"model": settings.FEATHERLESS_MODEL, "messages": messages, "temperature": 0.2, "max_tokens": 700}
    headers = {"Authorization": f"Bearer {settings.FEATHERLESS_API_KEY}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        answer = data["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("Featherless research request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Featherless AI request failed") from exc
    return ResearchResponse(answer=answer, model=settings.FEATHERLESS_MODEL)


@router.post("/ask", response_model=ResearchResponse)
async def ask_research_assistant(request: ResearchRequest) -> ResearchResponse:
    """Answer a research question using the supplied backtest context."""
    context = {
        "symbol": request.symbol,
        "backtest_results": request.backtest_results,
    }
    return await generate_ai_answer(request.question, request.symbol, context)