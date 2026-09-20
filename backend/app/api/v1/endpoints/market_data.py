import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import pandas as pd

from app.core.config import settings
from app.data_providers.factory import get_data_provider
from app.indicators.technical import (
    compute_sma,
    compute_ema,
    compute_returns,
    compute_drawdown_series,
    compute_rolling_volatility,
    compute_rolling_returns
)
from app.indicators.metrics import compute_comprehensive_metrics

logger = logging.getLogger(__name__)
router = APIRouter()

def filter_by_timeframe(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
    if df.empty or timeframe.upper() == "ALL":
        return df
    
    tf = timeframe.upper()
    now = df.index.max()
    days_map = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
        "3Y": 3 * 365,
        "5Y": 5 * 365
    }
    days = days_map.get(tf)
    if days:
        cutoff = now - timedelta(days=days)
        return df[df.index >= cutoff]
    return df

@router.get("/assets", response_model=List[Dict[str, Any]])
def get_assets():
    """
    Return all tracked core assets with latest market price, 24h delta, and metadata.
    """
    provider = get_data_provider()
    results = []

    for sym, meta in settings.ASSETS.items():
        try:
            df = provider.get_historical_ohlcv(sym)
            if df is not None and len(df) >= 2:
                latest_close = float(df["close"].iloc[-1])
                prev_close = float(df["close"].iloc[-2])
                change_val = latest_close - prev_close
                change_pct = (change_val / prev_close) * 100.0
                latest_vol = float(df["volume"].iloc[-1])
                last_date = str(df.index[-1].date())
            else:
                latest_close, change_val, change_pct, latest_vol, last_date = 0.0, 0.0, 0.0, 0.0, ""

            results.append({
                "symbol": sym,
                "name": meta["name"],
                "ticker": meta["ticker"],
                "asset_class": meta["asset_class"],
                "currency": meta["currency"],
                "is_crypto": meta["is_crypto"],
                "latest_price": round(latest_close, 2),
                "change_24h": round(change_val, 2),
                "change_24h_pct": round(change_pct, 2),
                "volume_24h": round(latest_vol, 0),
                "last_date": last_date,
                "data_provider": provider.provider_name
            })
        except Exception as e:
            logger.error(f"Error fetching asset overview for {sym}: {e}")
            results.append({
                "symbol": sym,
                "name": meta["name"],
                "ticker": meta["ticker"],
                "asset_class": meta["asset_class"],
                "error": str(e)
            })

    return results


@router.get("/fx-rates")
def get_fx_rates():
    """Return live USD conversion rates for dashboard display currencies."""
    provider = get_data_provider()
    rates = {"USD": 1.0}
    for currency, ticker in {"INR": "INR=X", "EUR": "EURUSD=X", "GBP": "GBPUSD=X"}.items():
        try:
            frame = provider.fetch_ohlcv(ticker, start=(datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d"))
            quote = float(frame["close"].dropna().iloc[-1])
            rates[currency] = round(quote if currency == "INR" else 1 / quote, 8)
        except Exception as exc:
            logger.warning("Could not fetch %s conversion rate: %s", currency, exc)
    return {"base": "USD", "rates": rates}

@router.get("/history")
def get_asset_history(
    symbol: str = Query(..., description="Asset symbol: GOLD, BTC, or NVDA"),
    timeframe: str = Query("1Y", description="1M, 6M, 1Y, 3Y, 5Y, or ALL"),
    sma_fast: int = Query(20, description="Fast SMA window"),
    sma_slow: int = Query(50, description="Slow SMA window"),
    ema_fast: int = Query(20, description="Fast EMA span"),
    ema_slow: int = Query(50, description="Slow EMA span"),
    force_refresh: bool = Query(False, description="Bypass cache and refetch")
):
    """
    Get full OHLCV series + real computed technical indicators.
    """
    sym = symbol.upper()
    if sym not in settings.ASSETS:
        raise HTTPException(status_code=400, detail=f"Unsupported symbol '{sym}'. Supported: {list(settings.ASSETS.keys())}")

    provider = get_data_provider()
    try:
        df = provider.get_historical_ohlcv(sym, force_refresh=force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market data fetch error: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data points found for {sym}")

    # Compute indicators on complete history before filtering timeframe to prevent edge distortion
    df["returns"] = compute_returns(df["close"])
    df[f"sma_{sma_fast}"] = compute_sma(df["close"], sma_fast)
    df[f"sma_{sma_slow}"] = compute_sma(df["close"], sma_slow)
    df[f"ema_{ema_fast}"] = compute_ema(df["close"], ema_fast)
    df[f"ema_{ema_slow}"] = compute_ema(df["close"], ema_slow)
    _, df["drawdown"] = compute_drawdown_series(df["close"])
    df["volatility_30d"] = compute_rolling_volatility(
        df["returns"], 
        window=30, 
        annualize_factor=365 if settings.ASSETS[sym]["is_crypto"] else 252
    )

    # Filter to requested timeframe
    filtered_df = filter_by_timeframe(df, timeframe)

    # Format JSON payload
    bars = []
    for idx, row in filtered_df.iterrows():
        bars.append({
            "timestamp": idx.strftime("%Y-%m-%d"),
            "open": round(float(row["open"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "close": round(float(row["close"]), 2),
            "volume": round(float(row["volume"]), 2),
            "returns": round(float(row["returns"]), 4),
            f"sma_{sma_fast}": None if pd.isna(row[f"sma_{sma_fast}"]) else round(float(row[f"sma_{sma_fast}"]), 2),
            f"sma_{sma_slow}": None if pd.isna(row[f"sma_{sma_slow}"]) else round(float(row[f"sma_{sma_slow}"]), 2),
            f"ema_{ema_fast}": None if pd.isna(row[f"ema_{ema_fast}"]) else round(float(row[f"ema_{ema_fast}"]), 2),
            f"ema_{ema_slow}": None if pd.isna(row[f"ema_{ema_slow}"]) else round(float(row[f"ema_{ema_slow}"]), 2),
            "drawdown_pct": round(float(row["drawdown"]) * 100, 2),
            "volatility_pct": None if pd.isna(row["volatility_30d"]) else round(float(row["volatility_30d"]) * 100, 2)
        })

    is_crypto = settings.ASSETS[sym]["is_crypto"]
    metrics = compute_comprehensive_metrics(filtered_df["close"], is_crypto=is_crypto)

    return {
        "symbol": sym,
        "meta": settings.ASSETS[sym],
        "timeframe": timeframe,
        "total_bars": len(bars),
        "data_provider": provider.provider_name,
        "metrics": metrics,
        "bars": bars
    }

@router.get("/metrics")
def get_asset_metrics(
    symbol: str = Query(..., description="Asset symbol: GOLD, BTC, or NVDA"),
    timeframe: str = Query("ALL", description="Time window for metrics calculation"),
    risk_free_rate: float = Query(0.04, description="Annual risk-free benchmark rate")
):
    """
    Calculate quantitative risk-adjusted performance metrics.
    """
    sym = symbol.upper()
    if sym not in settings.ASSETS:
        raise HTTPException(status_code=400, detail=f"Unsupported symbol '{sym}'")

    provider = get_data_provider()
    df = provider.get_historical_ohlcv(sym)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available")

    filtered_df = filter_by_timeframe(df, timeframe)
    is_crypto = settings.ASSETS[sym]["is_crypto"]
    metrics = compute_comprehensive_metrics(filtered_df["close"], risk_free_rate=risk_free_rate, is_crypto=is_crypto)

    return {
        "symbol": sym,
        "timeframe": timeframe,
        "risk_free_rate": risk_free_rate,
        "metrics": metrics
    }

@router.get("/correlation")
def get_correlation_matrix(
    timeframe: str = Query("1Y", description="Time window for correlation calculation"),
    rolling_window: int = Query(60, description="Rolling window size in days")
):
    """
    Generate cross-asset correlation matrix and historical rolling correlation between assets.
    """
    provider = get_data_provider()
    price_dict = {}

    for sym in settings.ASSETS.keys():
        df = provider.get_historical_ohlcv(sym)
        if df is not None and not df.empty:
            filtered = filter_by_timeframe(df, timeframe)
            price_dict[sym] = filtered["close"].pct_change().dropna()

    combined_df = pd.DataFrame(price_dict).dropna()
    if combined_df.empty or len(combined_df) < 10:
        raise HTTPException(status_code=400, detail="Insufficient overlapping data to compute correlation.")

    # Static correlation matrix
    corr_matrix = combined_df.corr().round(4).to_dict()

    # Rolling correlation series between pairs
    rolling_series = []
    pairs = [("BTC", "NVDA"), ("BTC", "GOLD"), ("GOLD", "NVDA")]
    
    # Compute rolling correlations
    rolling_df = pd.DataFrame()
    for s1, s2 in pairs:
        if s1 in combined_df.columns and s2 in combined_df.columns:
            rolling_df[f"{s1}_{s2}"] = combined_df[s1].rolling(window=rolling_window).corr(combined_df[s2])

    rolling_df.dropna(inplace=True)
    for idx, row in rolling_df.iterrows():
        entry = {"timestamp": idx.strftime("%Y-%m-%d")}
        for pair_col in rolling_df.columns:
            entry[pair_col] = round(float(row[pair_col]), 3) if not pd.isna(row[pair_col]) else None
        rolling_series.append(entry)

    return {
        "timeframe": timeframe,
        "rolling_window_days": rolling_window,
        "assets": list(combined_df.columns),
        "correlation_matrix": corr_matrix,
        "rolling_correlation": rolling_series
    }
