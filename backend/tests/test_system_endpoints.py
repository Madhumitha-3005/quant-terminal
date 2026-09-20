import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system_status():
    resp = client.get("/api/v1/system/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "active_provider" in data
    assert "total_cached_bars" in data
    assert data["total_cached_bars"] > 1000

def test_providers_and_switch():
    resp = client.get("/api/v1/system/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["providers"]) == 2

    # Test switch
    switch_resp = client.post("/api/v1/system/providers/switch", json={"provider": "hackathon_api"})
    assert switch_resp.status_code == 200
    assert switch_resp.json()["active_provider"] == "hackathon_api"

    # Switch back
    switch_resp2 = client.post("/api/v1/system/providers/switch", json={"provider": "yfinance"})
    assert switch_resp2.status_code == 200

def test_cache_stats_and_offline():
    resp = client.get("/api/v1/system/cache/stats")
    assert resp.status_code == 200
    assert "total_bars" in resp.json()

    # Toggle offline
    toggle_resp = client.post("/api/v1/system/cache/toggle-offline", json={"enabled": True})
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["simulated_offline"] is True

    # Restore online
    toggle_resp2 = client.post("/api/v1/system/cache/toggle-offline", json={"enabled": False})
    assert toggle_resp2.status_code == 200

def test_lookahead_audit():
    resp = client.get("/api/v1/system/audit/lookahead?symbol=NVDA&target_idx=-30")
    assert resp.status_code == 200
    data = resp.json()
    assert "signal_evaluation" in data
    assert "execution_mechanics" in data
    assert "causal_execution" in data["execution_mechanics"]
    assert "biased_execution_leak" in data["execution_mechanics"]