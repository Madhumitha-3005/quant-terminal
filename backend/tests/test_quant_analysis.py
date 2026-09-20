import numpy as np
import pandas as pd
import pytest

from app.services.quant_analysis import (
    audit_price_frame,
    calculate_portfolio_risk,
    calculate_stress_scenario,
    run_strategy,
    validate_weights,
    calculate_monte_carlo_bands,
    calculate_sma_robustness,
)


def sample_frame():
    index = pd.date_range("2024-01-01", periods=80, freq="D")
    close = pd.Series(np.linspace(100, 140, len(index)), index=index)
    return pd.DataFrame({"open": close, "high": close + 1, "low": close - 1, "close": close, "volume": 1000}, index=index)


def test_stress_scenario_calculates_loss_and_recovery():
    result = calculate_stress_scenario({"A": 0.6, "B": 0.4}, {"A": -10, "B": -20}, 1000)
    assert result["scenario_value"] == 860.0
    assert result["absolute_pnl"] == -140.0
    assert result["recovery_required_pct"] == pytest.approx(16.2791, rel=1e-3)


def test_weights_must_sum_to_one():
    with pytest.raises(ValueError, match="sum to 1.0"):
        validate_weights({"A": 0.8, "B": 0.1})


def test_portfolio_risk_uses_real_overlapping_returns():
    frame = sample_frame()
    result = calculate_portfolio_risk({"A": frame, "B": frame * 1.1}, {"A": 0.5, "B": 0.5})
    assert result["data_points"] == 79
    assert result["portfolio_return_pct"] > 0
    assert set(result["risk_contribution_pct"]) == {"A", "B"}


def test_strategy_uses_supported_names_and_trade_count():
    result = run_strategy(sample_frame(), "sma_crossover", transaction_cost_bps=10, slippage_bps=5)
    assert result["strategy"] == "sma_crossover"
    assert "number_of_trades" in result["metrics"]
    assert result["assumptions"]["lookahead_protection"] is True


def test_integrity_audit_reports_data_checks():
    checks = audit_price_frame(sample_frame())
    names = {check["name"] for check in checks}
    assert "Data ordering" in names
    assert "Duplicate timestamps" in names
    assert all(check["status"] in {"PASS", "FAIL", "WARNING", "NOT CHECKED", "NOT APPLICABLE"} for check in checks)


def test_sma_robustness_returns_expected_grid_shape():
    result = calculate_sma_robustness(sample_frame(), [5, 10], [20, 40, 60])
    assert len(result["sharpe_grid"]) == 2
    assert all(len(row) == 3 for row in result["sharpe_grid"])
    assert result["fast_periods"] == [5, 10]


def test_monte_carlo_returns_percentile_bands():
    returns = sample_frame()["close"].pct_change().dropna()
    result = calculate_monte_carlo_bands(returns, initial_capital=1000, simulations=50, seed=7)
    assert result["simulations"] == 50
    assert len(result["bands"]) == len(returns)
    assert set(result["bands"][0]) == {"step", "p10", "median", "p90"}