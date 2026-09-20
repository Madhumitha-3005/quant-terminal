import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["api_key_configured"] is True
    assert "GOLD" in data["cached_assets"]

def test_assets_endpoint():
    response = client.get("/api/v1/market/assets")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) == 3
    symbols = [a["symbol"] for a in assets]
    assert "GOLD" in symbols and "BTC" in symbols and "NVDA" in symbols
    for a in assets:
        assert a["latest_price"] > 0
        assert "ticker" in a

def test_history_endpoint():
    response = client.get("/api/v1/market/history?symbol=NVDA&timeframe=1Y&sma_fast=20&sma_slow=50")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "NVDA"
    assert len(data["bars"]) > 200
    first_bar = data["bars"][0]
    assert "open" in first_bar and "close" in first_bar
    assert "sma_20" in first_bar
    assert "sma_50" in first_bar
    assert "drawdown_pct" in first_bar
    metrics = data["metrics"]
    assert "sharpe_ratio" in metrics
    assert "annualized_volatility_pct" in metrics
    assert "max_drawdown_pct" in metrics

def test_correlation_endpoint():
    response = client.get("/api/v1/market/correlation?timeframe=1Y&rolling_window=30")
    assert response.status_code == 200
    data = response.json()
    assert "correlation_matrix" in data
    assert "rolling_correlation" in data
    assert len(data["rolling_correlation"]) > 0