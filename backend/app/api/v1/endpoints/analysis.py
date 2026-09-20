from typing import Any, Dict, List, Literal

from fastapi import APIRouter, HTTPException
import pandas as pd
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings
from app.data_providers.factory import get_data_provider
from app.services.quant_analysis import (
    audit_price_frame,
    calculate_portfolio_risk,
    calculate_stress_scenario,
    run_strategy,
    calculate_monte_carlo_bands,
    calculate_sma_robustness,
)
from app.api.v1.endpoints.research import generate_ai_answer

router = APIRouter()


class StressRequest(BaseModel):
    allocations: Dict[str, float]
    changes_pct: Dict[str, float]
    initial_value: float = Field(default=100000, gt=0)


class PortfolioRequest(BaseModel):
    weights: Dict[str, float]


class StrategyRequest(BaseModel):
    symbol: str
    strategies: List[Literal["buy_and_hold", "sma_crossover", "momentum"]] = ["buy_and_hold", "sma_crossover", "momentum"]
    transaction_cost_bps: float = Field(default=0, ge=0, le=1000)
    slippage_bps: float = Field(default=0, ge=0, le=1000)


class RobustnessRequest(BaseModel):
    symbol: str
    strategy: Literal["sma_crossover", "momentum"] = "sma_crossover"
    fast_periods: List[int] = [5, 10, 15, 20]
    slow_periods: List[int] = [20, 40, 60, 80, 100]


class MonteCarloRequest(BaseModel):
    symbol: str
    strategy: Literal["buy_and_hold", "sma_crossover", "momentum"] = "sma_crossover"
    simulations: int = Field(default=500, ge=50, le=2000)
    initial_capital: float = Field(default=100000, gt=0)


class ReportRequest(BaseModel):
    symbol: str
    strategy: str
    metrics: Dict[str, Any]

    @field_validator("symbol")
    @classmethod
    def supported_symbol(cls, value: str) -> str:
        value = value.upper()
        if value not in settings.ASSETS:
            raise ValueError(f"Unsupported symbol: {value}")
        return value


def _fetch_frames(symbols: List[str]):
    provider = get_data_provider()
    frames = {}
    for symbol in symbols:
        if symbol not in settings.ASSETS:
            raise HTTPException(status_code=400, detail=f"Unsupported symbol: {symbol}")
        frame = provider.get_historical_ohlcv(symbol)
        if frame is None or frame.empty:
            raise HTTPException(status_code=404, detail=f"No market data for {symbol}")
        frames[symbol] = frame
    return frames


@router.post("/stress")
def stress_scenario(request: StressRequest):
    try:
        result = calculate_stress_scenario(request.allocations, request.changes_pct, request.initial_value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"scenario": result}


@router.post("/portfolio/risk")
def portfolio_risk(request: PortfolioRequest):
    symbols = list(request.weights)
    frames = _fetch_frames(symbols)
    crypto_symbols = [symbol for symbol in symbols if settings.ASSETS[symbol]["is_crypto"]]
    try:
        return calculate_portfolio_risk(frames, request.weights, crypto_symbols)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/strategies/compare")
def compare_strategies(request: StrategyRequest):
    frame = _fetch_frames([request.symbol])[request.symbol]
    try:
        results = [run_strategy(frame, strategy, request.transaction_cost_bps, request.slippage_bps) for strategy in request.strategies]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"symbol": request.symbol, "results": results, "historical_only": True}


@router.post("/audit")
def audit_backtest(request: StrategyRequest):
    frame = _fetch_frames([request.symbol])[request.symbol]
    return {
        "symbol": request.symbol,
        "checks": audit_price_frame(frame),
        "limitations": [
            "This audit checks the available data and execution conventions; it cannot detect every strategy or implementation bias.",
            "Transaction costs and slippage are warnings until explicitly configured for a strategy run.",
        ],
    }


@router.post("/robustness")
def strategy_robustness(request: RobustnessRequest):
    frame = _fetch_frames([request.symbol.upper()])[request.symbol.upper()]
    try:
        return calculate_sma_robustness(frame, request.fast_periods, request.slow_periods, request.strategy)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/monte-carlo")
def monte_carlo(request: MonteCarloRequest):
    frame = _fetch_frames([request.symbol.upper()])[request.symbol.upper()]
    try:
        strategy_result = run_strategy(frame, request.strategy)
        equity = [point["value"] for point in strategy_result["equity_curve"]]
        returns = pd.Series(equity).pct_change().dropna()
        result = calculate_monte_carlo_bands(returns, request.initial_capital, request.simulations)
        result["historical_equity"] = [
            {"step": index + 1, "value": round(float(value * request.initial_capital), 2)}
            for index, value in enumerate(equity)
        ]
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/report")
async def generate_report(request: ReportRequest):
    prompt = (
        f"Write one concise plain-English paragraph about the historical {request.strategy} backtest "
        f"for {request.symbol}. Use only the exact metrics below: {request.metrics}. Explain what the "
        "strategy did, its performance, key risks and limitations. Do not invent any number or cause; "
        "state that historical results do not guarantee future performance."
    )
    return await generate_ai_answer(prompt, request.symbol, {"strategy": request.strategy, "metrics": request.metrics})