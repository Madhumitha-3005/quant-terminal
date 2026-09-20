from typing import Optional
import numpy as np
import pandas as pd

def compute_sma(series: pd.Series, window: int) -> pd.Series:
    """Compute Simple Moving Average."""
    return series.rolling(window=window, min_periods=window).mean()

def compute_ema(series: pd.Series, span: int) -> pd.Series:
    """Compute Exponential Moving Average."""
    return series.ewm(span=span, adjust=False).mean()

def compute_returns(series: pd.Series) -> pd.Series:
    """Compute percentage daily returns."""
    return series.pct_change().fillna(0.0)

def compute_log_returns(series: pd.Series) -> pd.Series:
    """Compute log daily returns."""
    return np.log(series / series.shift(1)).fillna(0.0)

def compute_cumulative_returns(returns: pd.Series) -> pd.Series:
    """Compute compound cumulative return multiplier from returns."""
    return (1.0 + returns).cumprod() - 1.0

def compute_rolling_volatility(
    returns: pd.Series, 
    window: int = 30, 
    annualize_factor: int = 252
) -> pd.Series:
    """Compute rolling annualized volatility."""
    return returns.rolling(window=window, min_periods=window).std() * np.sqrt(annualize_factor)

def compute_drawdown_series(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    """
    Compute cumulative high-water mark and drawdown percentage series.
    Returns: (hwm, drawdown_series)
    """
    hwm = series.cummax()
    drawdown = (series - hwm) / hwm
    return hwm, drawdown

def compute_rolling_returns(series: pd.Series, window: int = 30) -> pd.Series:
    """Compute rolling N-period percentage return."""
    return (series / series.shift(window) - 1.0).fillna(0.0)
