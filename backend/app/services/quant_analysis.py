from typing import Any, Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.indicators.metrics import compute_comprehensive_metrics
from app.indicators.technical import compute_sma


def validate_weights(weights: Dict[str, float], tolerance: float = 1e-6) -> None:
    if not weights:
        raise ValueError("At least one portfolio weight is required")
    if any(not np.isfinite(value) or value < 0 for value in weights.values()):
        raise ValueError("Portfolio weights must be finite and non-negative")
    total = sum(weights.values())
    if abs(total - 1.0) > tolerance:
        raise ValueError(f"Portfolio weights must sum to 1.0; received {total:.6f}")


def calculate_stress_scenario(
    allocations: Dict[str, float],
    changes_pct: Dict[str, float],
    initial_value: float,
) -> Dict[str, Any]:
    if not np.isfinite(initial_value) or initial_value <= 0:
        raise ValueError("Initial portfolio value must be positive")
    validate_weights(allocations)
    if set(changes_pct) - set(allocations):
        raise ValueError("Scenario changes may only reference allocated assets")

    contributions = []
    scenario_value = 0.0
    for symbol, weight in allocations.items():
        change = float(changes_pct.get(symbol, 0.0))
        if not np.isfinite(change) or change <= -100:
            raise ValueError("Scenario changes must be finite and greater than -100%")
        initial_asset_value = initial_value * weight
        pnl = initial_asset_value * change / 100
        scenario_value += initial_asset_value + pnl
        contributions.append({
            "symbol": symbol,
            "allocation_pct": round(weight * 100, 4),
            "change_pct": round(change, 4),
            "initial_value": round(initial_asset_value, 2),
            "pnl": round(pnl, 2),
            "contribution_pct": round((pnl / initial_value) * 100, 4),
        })

    pnl = scenario_value - initial_value
    recovery = abs(pnl) / scenario_value * 100 if pnl < 0 and scenario_value > 0 else 0.0
    return {
        "initial_value": round(initial_value, 2),
        "scenario_value": round(scenario_value, 2),
        "absolute_pnl": round(pnl, 2),
        "pnl_pct": round((pnl / initial_value) * 100, 4),
        "recovery_required_pct": round(recovery, 4),
        "contributions": contributions,
        "hypothetical": True,
    }


def build_returns(price_frames: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    prices = {
        symbol: frame["close"].rename(symbol)
        for symbol, frame in price_frames.items()
        if frame is not None and not frame.empty and "close" in frame
    }
    if not prices:
        raise ValueError("No usable price series supplied")
    returns = pd.concat(prices.values(), axis=1).sort_index().pct_change().dropna(how="all")
    if returns.empty:
        raise ValueError("Insufficient overlapping price history")
    return returns.dropna()


def calculate_portfolio_risk(
    price_frames: Dict[str, pd.DataFrame],
    weights: Dict[str, float],
    is_crypto: Iterable[str] = (),
) -> Dict[str, Any]:
    validate_weights(weights)
    if set(weights) - set(price_frames):
        raise ValueError("Missing market data for one or more portfolio assets")
    returns = build_returns({symbol: price_frames[symbol] for symbol in weights})
    returns = returns[list(weights)]
    weight_vector = np.array([weights[symbol] for symbol in returns.columns])
    periods = 365 if any(symbol in set(is_crypto) for symbol in weights) else 252
    portfolio_returns = returns.dot(weight_vector)
    equity = (1 + portfolio_returns).cumprod()
    covariance = returns.cov() * periods
    portfolio_volatility = float(np.sqrt(weight_vector @ covariance.values @ weight_vector))
    contributions = covariance.values @ weight_vector
    total_risk = float(weight_vector @ contributions)
    risk_contribution = {
        symbol: round(float(weight_vector[index] * contributions[index] / total_risk * 100), 4)
        if total_risk > 0 else 0.0
        for index, symbol in enumerate(returns.columns)
    }
    return {
        "analysis_start": str(returns.index.min().date()),
        "analysis_end": str(returns.index.max().date()),
        "data_points": len(returns),
        "portfolio_return_pct": round(float((equity.iloc[-1] - 1) * 100), 4),
        "portfolio_volatility_pct": round(portfolio_volatility * 100, 4),
        "portfolio_max_drawdown_pct": round(float((equity / equity.cummax() - 1).min() * 100), 4),
        "concentration_hhi": round(float(sum(value * value for value in weights.values())), 6),
        "risk_contribution_pct": risk_contribution,
        "weights_pct": {symbol: round(value * 100, 4) for symbol, value in weights.items()},
        "correlation_matrix": returns.corr().round(4).to_dict(),
    }


def _apply_costs(returns: pd.Series, position: pd.Series, transaction_cost_bps: float, slippage_bps: float) -> pd.Series:
    trades = position.diff().abs().fillna(position.abs())
    cost = trades * ((transaction_cost_bps + slippage_bps) / 10000)
    return position.shift(1).fillna(0) * returns - cost


def run_strategy(
    price_frame: pd.DataFrame,
    strategy: str,
    transaction_cost_bps: float = 0,
    slippage_bps: float = 0,
    sma_fast: int = 20,
    sma_slow: int = 50,
    momentum_lookback: int = 20,
    momentum_threshold_pct: float = 0,
) -> Dict[str, Any]:
    if price_frame is None or len(price_frame) < 60:
        raise ValueError("At least 60 historical bars are required")
    if transaction_cost_bps < 0 or slippage_bps < 0:
        raise ValueError("Costs and slippage cannot be negative")
    if sma_fast < 2 or sma_slow <= sma_fast:
        raise ValueError("SMA slow period must be greater than fast period, and fast must be at least 2")
    if momentum_lookback < 2 or not np.isfinite(momentum_threshold_pct):
        raise ValueError("Momentum lookback must be at least 2 and threshold must be finite")
    close = price_frame["close"].astype(float)
    returns = close.pct_change().fillna(0)
    name = strategy.lower().replace(" ", "_")
    if name == "buy_and_hold":
        position = pd.Series(1.0, index=close.index)
    elif name == "sma_crossover":
        fast = compute_sma(close, sma_fast)
        slow = compute_sma(close, sma_slow)
        position = (fast > slow).astype(float).fillna(0)
    elif name == "momentum":
        position = (close.pct_change(momentum_lookback) > momentum_threshold_pct / 100).astype(float).fillna(0)
    else:
        raise ValueError("Supported strategies: buy_and_hold, sma_crossover, momentum")

    strategy_returns = _apply_costs(returns, position, transaction_cost_bps, slippage_bps)
    equity = (1 + strategy_returns).cumprod()
    metrics = compute_comprehensive_metrics(equity, is_crypto=False)
    metrics["number_of_trades"] = int(position.diff().abs().fillna(position.abs()).gt(0).sum())
    return {
        "strategy": name,
        "metrics": metrics,
        "equity_curve": [{"timestamp": str(index.date()), "value": round(float(value), 6)} for index, value in equity.items()],
        "assumptions": {
            "execution": "signal at close, fill at next bar open approximation via one-bar return shift",
            "transaction_cost_bps": transaction_cost_bps,
            "slippage_bps": slippage_bps,
            "lookahead_protection": True,
            "sma_fast": sma_fast,
            "sma_slow": sma_slow,
            "momentum_lookback": momentum_lookback,
            "momentum_threshold_pct": momentum_threshold_pct,
        },
    }


def calculate_sma_robustness(
    price_frame: pd.DataFrame,
    fast_periods: List[int],
    slow_periods: List[int],
    strategy: str = "sma_crossover",
) -> Dict[str, Any]:
    if not fast_periods or not slow_periods:
        raise ValueError("At least one fast and slow period is required")
    if len(fast_periods) * len(slow_periods) > 100:
        raise ValueError("Parameter grid is limited to 100 combinations")
    grid = []
    strategy = strategy.lower()
    for fast in fast_periods:
        row = []
        for slow in slow_periods:
            if strategy == "sma_crossover" and slow <= fast:
                row.append(None)
                continue
            if strategy == "sma_crossover":
                result = run_strategy(price_frame, strategy, sma_fast=fast, sma_slow=slow)
            elif strategy == "momentum":
                result = run_strategy(price_frame, strategy, momentum_lookback=fast, momentum_threshold_pct=slow)
            else:
                raise ValueError("Robustness supports sma_crossover and momentum")
            row.append(result["metrics"]["sharpe_ratio"])
        grid.append(row)
    return {
        "fast_periods": fast_periods,
        "slow_periods": slow_periods,
        "sharpe_grid": grid,
        "strategy": strategy,
        "x_label": "Fast SMA period" if strategy == "sma_crossover" else "Momentum lookback",
        "y_label": "Slow SMA period" if strategy == "sma_crossover" else "Return threshold %",
        "explanation": "A robust strategy shows consistently good performance across nearby parameters, not just one lucky combination.",
    }


def calculate_monte_carlo_bands(
    returns: pd.Series,
    initial_capital: float = 100000,
    simulations: int = 500,
    seed: Optional[int] = 42,
) -> Dict[str, Any]:
    clean_returns = pd.Series(returns, dtype=float).replace([np.inf, -np.inf], np.nan).dropna()
    if len(clean_returns) < 10:
        raise ValueError("At least 10 historical returns are required")
    if initial_capital <= 0 or simulations < 50 or simulations > 2000:
        raise ValueError("Initial capital must be positive and simulations must be between 50 and 2000")
    rng = np.random.default_rng(seed)
    sampled = rng.choice(clean_returns.to_numpy(), size=(simulations, len(clean_returns)), replace=True)
    paths = initial_capital * np.cumprod(1 + sampled, axis=1)
    percentile_values = np.percentile(paths, [10, 50, 90], axis=0)
    points = []
    for index in range(paths.shape[1]):
        points.append({
            "step": index + 1,
            "p10": round(float(percentile_values[0, index]), 2),
            "median": round(float(percentile_values[1, index]), 2),
            "p90": round(float(percentile_values[2, index]), 2),
        })
    return {
        "initial_capital": initial_capital,
        "simulations": simulations,
        "historical_return_count": len(clean_returns),
        "bands": points,
        "disclaimer": "This is a statistical simulation based on resampled historical returns, not a prediction of future performance.",
    }


def audit_price_frame(frame: pd.DataFrame, train_ratio: float = 0.7) -> List[Dict[str, Any]]:
    checks: List[Dict[str, Any]] = []
    index = pd.DatetimeIndex(frame.index)
    checks.append({"name": "Data ordering", "status": "PASS" if index.is_monotonic_increasing else "FAIL", "evidence": "Datetime index monotonic increasing"})
    checks.append({"name": "Duplicate timestamps", "status": "FAIL" if index.has_duplicates else "PASS", "evidence": f"{int(index.duplicated().sum())} duplicates"})
    missing = int(frame[["open", "high", "low", "close", "volume"]].isna().sum().sum())
    checks.append({"name": "Missing OHLCV values", "status": "FAIL" if missing else "PASS", "evidence": f"{missing} missing values"})
    split = int(len(frame) * train_ratio)
    checks.append({"name": "Time-series train/test separation", "status": "PASS" if 0 < split < len(frame) else "FAIL", "evidence": f"Train {split} bars / test {len(frame) - split} bars"})
    checks.append({"name": "Strategy execution timing", "status": "PASS", "evidence": "Signals are shifted one bar before returns"})
    checks.append({"name": "Transaction costs", "status": "WARNING", "evidence": "Configured per request; not inferred from market data"})
    checks.append({"name": "Slippage", "status": "WARNING", "evidence": "Configured per request; not inferred from market data"})
    return checks