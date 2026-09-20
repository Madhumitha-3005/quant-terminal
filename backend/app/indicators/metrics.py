import numpy as np
import pandas as pd
from typing import Dict, Any

def calculate_annualized_return(series: pd.Series, periods_per_year: int = 252) -> float:
    """Calculate CAGR (Compound Annual Growth Rate)."""
    if len(series) < 2 or series.iloc[0] <= 0:
        return 0.0
    total_return = (series.iloc[-1] / series.iloc[0])
    num_years = len(series) / periods_per_year
    if num_years <= 0:
        return 0.0
    return float((total_return ** (1.0 / num_years)) - 1.0)

def calculate_annualized_volatility(returns: pd.Series, periods_per_year: int = 252) -> float:
    """Calculate annualized standard deviation of returns."""
    if len(returns) < 2:
        return 0.0
    return float(returns.std() * np.sqrt(periods_per_year))

def calculate_sharpe_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.04,
    periods_per_year: int = 252
) -> float:
    """
    Calculate annualized Sharpe ratio.
    Default risk-free rate is 4.0% (0.04).
    """
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (risk_free_rate / periods_per_year)
    std = returns.std()
    if std == 0 or np.isnan(std):
        return 0.0
    return float((excess_returns.mean() / std) * np.sqrt(periods_per_year))

def calculate_sortino_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.04,
    periods_per_year: int = 252
) -> float:
    """Calculate annualized Sortino ratio (downside risk only)."""
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (risk_free_rate / periods_per_year)
    downside_returns = returns[returns < 0]
    if len(downside_returns) < 2:
        return 0.0
    downside_std = downside_returns.std()
    if downside_std == 0 or np.isnan(downside_std):
        return 0.0
    return float((excess_returns.mean() / downside_std) * np.sqrt(periods_per_year))

def calculate_max_drawdown(series: pd.Series) -> float:
    """Calculate peak-to-trough maximum drawdown as a decimal (negative value)."""
    if len(series) < 2:
        return 0.0
    hwm = series.cummax()
    drawdowns = (series - hwm) / hwm
    return float(drawdowns.min())

def compute_comprehensive_metrics(
    price_series: pd.Series,
    risk_free_rate: float = 0.04,
    is_crypto: bool = False
) -> Dict[str, Any]:
    """
    Compute full institutional-grade summary statistics from real price data.
    """
    if price_series.empty:
        return {}

    periods_per_year = 365 if is_crypto else 252
    returns = price_series.pct_change().dropna()
    
    total_return = float((price_series.iloc[-1] / price_series.iloc[0]) - 1.0)
    cagr = calculate_annualized_return(price_series, periods_per_year)
    volatility = calculate_annualized_volatility(returns, periods_per_year)
    sharpe = calculate_sharpe_ratio(returns, risk_free_rate, periods_per_year)
    sortino = calculate_sortino_ratio(returns, risk_free_rate, periods_per_year)
    max_dd = calculate_max_drawdown(price_series)
    calmar = float(cagr / abs(max_dd)) if max_dd != 0 else 0.0

    return {
        "start_date": str(price_series.index.min().date()),
        "end_date": str(price_series.index.max().date()),
        "start_price": round(float(price_series.iloc[0]), 2),
        "latest_price": round(float(price_series.iloc[-1]), 2),
        "total_return_pct": round(total_return * 100, 2),
        "cagr_pct": round(cagr * 100, 2),
        "annualized_volatility_pct": round(volatility * 100, 2),
        "sharpe_ratio": round(sharpe, 3),
        "sortino_ratio": round(sortino, 3),
        "max_drawdown_pct": round(max_dd * 100, 2),
        "calmar_ratio": round(calmar, 3),
        "data_points": len(price_series)
    }
