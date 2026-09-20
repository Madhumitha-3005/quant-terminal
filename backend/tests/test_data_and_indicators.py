import pytest
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.cache import market_cache
from app.data_providers.factory import get_data_provider
from app.indicators.technical import (
    compute_sma,
    compute_ema,
    compute_returns,
    compute_drawdown_series,
    compute_rolling_volatility
)
from app.indicators.metrics import (
    calculate_sharpe_ratio,
    calculate_annualized_volatility,
    calculate_max_drawdown,
    compute_comprehensive_metrics
)

def test_api_key_loaded():
    assert len(settings.API_KEY) > 0, "API_KEY should be loaded from .env"
    assert settings.API_KEY.startswith("rc_"), "Hackathon API key must have the issued prefix"

def test_technical_indicators():
    # Synthetic clean test series
    prices = pd.Series([100.0, 102.0, 104.0, 101.0, 105.0, 107.0, 110.0])
    
    # Returns
    rets = compute_returns(prices)
    assert len(rets) == len(prices)
    assert rets.iloc[0] == 0.0
    assert round(rets.iloc[1], 4) == 0.02

    # SMA 3
    sma3 = compute_sma(prices, 3)
    assert pd.isna(sma3.iloc[0])
    assert pd.isna(sma3.iloc[1])
    assert round(sma3.iloc[2], 2) == 102.0  # (100 + 102 + 104) / 3

    # Drawdown
    hwm, dd = compute_drawdown_series(prices)
    assert dd.max() <= 0.0
    assert dd.min() < 0.0  # dip from 104 to 101

def test_metrics():
    returns = pd.Series([0.01, -0.005, 0.02, 0.015, -0.01, 0.025, 0.005])
    vol = calculate_annualized_volatility(returns, 252)
    assert vol > 0.0

    sharpe = calculate_sharpe_ratio(returns, risk_free_rate=0.04, periods_per_year=252)
    assert isinstance(sharpe, float)

def test_cache_and_provider_fetch():
    provider = get_data_provider()
    # Test with BTC (active 365 days)
    df = provider.get_historical_ohlcv("BTC")
    assert df is not None
    assert not df.empty
    assert len(df) >= 100
    assert all(col in df.columns for col in ["open", "high", "low", "close", "volume"])
    
    # Test cache stats
    stats = market_cache.get_cache_stats()
    assert "BTC" in stats
    assert stats["BTC"]["count"] >= 100

if __name__ == "__main__":
    test_api_key_loaded()
    print("✓ test_api_key_loaded passed")
    test_technical_indicators()
    print("✓ test_technical_indicators passed")
    test_metrics()
    print("✓ test_metrics passed")
    test_cache_and_provider_fetch()
    print("✓ test_cache_and_provider_fetch passed")
    print("ALL TESTS PASSED SUCCESSFULLY!")
