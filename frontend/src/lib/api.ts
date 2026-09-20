import { AssetOverview, AssetHistoryResponse, CorrelationResponse, ResearchResponse, SystemStatus } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const SYSTEM_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "") 
  : "http://127.0.0.1:8000";

export async function getSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${SYSTEM_URL}/`);
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function getAssets(): Promise<AssetOverview[]> {
  const res = await fetch(`${API_BASE_URL}/market/assets`);
  if (!res.ok) throw new Error("Failed to fetch asset overview");
  return res.json();
}

export async function getFxRates(): Promise<{ base: string; rates: Record<string, number> }> {
  const res = await fetch(`${API_BASE_URL}/market/fx-rates`);
  if (!res.ok) throw new Error("Failed to fetch currency rates");
  return res.json();
}

export async function getAssetHistory(
  symbol: string,
  timeframe: string = "1Y",
  smaFast: number = 20,
  smaSlow: number = 50,
  emaFast: number = 20,
  emaSlow: number = 50
): Promise<AssetHistoryResponse> {
  const params = new URLSearchParams({
    symbol,
    timeframe,
    sma_fast: smaFast.toString(),
    sma_slow: smaSlow.toString(),
    ema_fast: emaFast.toString(),
    ema_slow: emaSlow.toString(),
  });

  const res = await fetch(`${API_BASE_URL}/market/history?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch history for ${symbol}`);
  }
  return res.json();
}

export async function getCorrelation(
  timeframe: string = "1Y",
  rollingWindow: number = 60
): Promise<CorrelationResponse> {
  const params = new URLSearchParams({
    timeframe,
    rolling_window: rollingWindow.toString(),
  });

  const res = await fetch(`${API_BASE_URL}/market/correlation?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch correlation matrix");
  return res.json();
}

// System Architecture & Interactive Tooling APIs
export async function getSystemFullStatus() {
  const res = await fetch(`${API_BASE_URL}/system/status`);
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function getProviders() {
  const res = await fetch(`${API_BASE_URL}/system/providers`);
  if (!res.ok) throw new Error("Failed to fetch providers");
  return res.json();
}

export async function switchProvider(provider: string) {
  const res = await fetch(`${API_BASE_URL}/system/providers/switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error("Failed to switch provider");
  return res.json();
}

export async function simulateProviderOutage(enabled: boolean) {
  const res = await fetch(`${API_BASE_URL}/system/providers/simulate-outage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to simulate provider outage");
  return res.json();
}

export async function getCacheDiagnostics() {
  const res = await fetch(`${API_BASE_URL}/system/cache/stats`);
  if (!res.ok) throw new Error("Failed to fetch cache diagnostics");
  return res.json();
}

export async function toggleOfflineMode(enabled: boolean) {
  const res = await fetch(`${API_BASE_URL}/system/cache/toggle-offline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to toggle offline mode");
  return res.json();
}

export async function syncCacheNow() {
  const res = await fetch(`${API_BASE_URL}/system/cache/sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync cache");
  return res.json();
}

export async function getLookaheadAudit(symbol: string = "NVDA", targetIdx: number = -25) {
  const res = await fetch(`${API_BASE_URL}/system/audit/lookahead?symbol=${symbol}&target_idx=${targetIdx}`);
  if (!res.ok) throw new Error("Failed to run lookahead audit");
  return res.json();
}

export async function askResearchAssistant(
  question: string,
  symbol: string,
  backtestResults: Record<string, unknown>
): Promise<ResearchResponse> {
  const res = await fetch(`${API_BASE_URL}/research/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, symbol, backtest_results: backtestResults }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Research assistant request failed");
  }
  return res.json();
}

export async function runStressScenario(payload: {
  allocations: Record<string, number>;
  changes_pct: Record<string, number>;
  initial_value: number;
}) {
  const res = await fetch(`${API_BASE_URL}/analysis/stress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Stress scenario failed");
  return res.json();
}

export async function getPortfolioRisk(weights: Record<string, number>) {
  const res = await fetch(`${API_BASE_URL}/analysis/portfolio/risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weights }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Portfolio risk analysis failed");
  return res.json();
}

export async function compareStrategies(symbol: string, transactionCostBps: number, slippageBps: number) {
  const res = await fetch(`${API_BASE_URL}/analysis/strategies/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, transaction_cost_bps: transactionCostBps, slippage_bps: slippageBps }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Strategy comparison failed");
  return res.json();
}

export async function runBacktestAudit(symbol: string) {
  const res = await fetch(`${API_BASE_URL}/analysis/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Backtest audit failed");
  return res.json();
}

export async function getStrategyRobustness(symbol: string, strategy: string) {
  const res = await fetch(`${API_BASE_URL}/analysis/robustness`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, strategy, ...(strategy === "momentum" ? { fast_periods: [5, 10, 20, 40], slow_periods: [-2, 0, 2, 5, 10] } : {}) }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Robustness analysis failed");
  return res.json();
}

export async function getMonteCarloBands(symbol: string, strategy: string, simulations: number) {
  const res = await fetch(`${API_BASE_URL}/analysis/monte-carlo`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, strategy, simulations }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Monte Carlo simulation failed");
  return res.json();
}

export async function generateBacktestReport(symbol: string, strategy: string, metrics: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/analysis/report`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, strategy, metrics }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Report generation failed");
  return res.json();
}