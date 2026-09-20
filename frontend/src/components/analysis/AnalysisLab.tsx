"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, BrainCircuit, CheckCircle2, FlaskConical, ShieldCheck, X } from "lucide-react";
import { compareStrategies, getPortfolioRisk, runBacktestAudit, runStressScenario } from "../../lib/api";
import { ToastTone } from "../feedback/Toast";

type LabTab = "stress" | "portfolio" | "strategies" | "audit";
const symbols = ["GOLD", "BTC", "NVDA"];

interface AnalysisLabProps {
  isOpen: boolean;
  selectedSymbol: string;
  onClose: () => void;
  onNotify: (message: string, tone: ToastTone) => void;
}

const initialWeights = { GOLD: 0.34, BTC: 0.33, NVDA: 0.33 };

export default function AnalysisLab({ isOpen, selectedSymbol, onClose, onNotify }: AnalysisLabProps) {
  const [tab, setTab] = useState<LabTab>("stress");
  const [weights, setWeights] = useState(initialWeights);
  const [changes, setChanges] = useState({ GOLD: -10, BTC: -20, NVDA: -15 });
  const [scenarioName, setScenarioName] = useState("Custom Scenario");
  const [initialValue, setInitialValue] = useState(100000);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [costBps, setCostBps] = useState(10);
  const [slippageBps, setSlippageBps] = useState(5);

  if (!isOpen) return null;

  const run = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (tab === "stress") setResult((await runStressScenario({ allocations: weights, changes_pct: changes, initial_value: initialValue })).scenario);
      if (tab === "portfolio") setResult(await getPortfolioRisk(weights));
      if (tab === "strategies") setResult(await compareStrategies(selectedSymbol, costBps, slippageBps));
      if (tab === "audit") setResult(await runBacktestAudit(selectedSymbol));
      onNotify("Analysis completed successfully.", "success");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Analysis failed";
      setError(message);
      onNotify(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateWeight = (symbol: string, value: string) => setWeights((current) => ({ ...current, [symbol]: Number(value) / 100 }));
  const updateChange = (symbol: string, value: string) => setChanges((current) => ({ ...current, [symbol]: Number(value) }));
  const weightTotal = symbols.reduce((total, symbol) => total + weights[symbol as keyof typeof weights], 0);
  const applyScenario = (name: string) => {
    setScenarioName(name);
    if (name === "Market Crash") setChanges({ GOLD: -12, BTC: -35, NVDA: -30 });
    if (name === "Technology Sector Drop") setChanges({ GOLD: 2, BTC: -8, NVDA: -30 });
    if (name === "Crypto Volatility Shock") setChanges({ GOLD: 0, BTC: -45, NVDA: -5 });
    if (name === "Custom Scenario") setChanges({ GOLD: 0, BTC: 0, NVDA: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-cyan-800/70 bg-[#0b101b] p-5 font-mono text-slate-200 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded border border-cyan-700/70 bg-cyan-950/60 p-2 text-cyan-300"><FlaskConical className="h-5 w-5" /></div>
            <div><h2 className="text-sm font-bold tracking-wider text-cyan-300">QUANTITATIVE ANALYSIS LABS</h2><p className="mt-1 text-[11px] text-slate-500">Hypothetical scenarios, portfolio risk, strategies, and integrity checks</p></div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close analysis labs"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 border-b border-slate-800 sm:grid-cols-4">
          {(["stress", "portfolio", "strategies", "audit"] as LabTab[]).map((item) => (
            <button key={item} onClick={() => { setTab(item); setResult(null); setError(""); }} className={`border-b-2 px-2 py-2 text-[10px] font-bold tracking-wide ${tab === item ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {item === "stress" ? "WHAT-IF SIMULATOR" : item === "portfolio" ? "PORTFOLIO RISK" : item === "strategies" ? "STRATEGY LAB" : "INTEGRITY AUDIT"}
            </button>
          ))}
        </div>

        {tab === "stress" || tab === "portfolio" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              {tab === "stress" && <>
                <label className="block text-xs text-slate-400">INITIAL PORTFOLIO VALUE<input type="number" min="1" value={initialValue} onChange={(event) => setInitialValue(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-700 bg-[#080b11] p-2 text-slate-200" /></label>
                <div className="flex flex-wrap gap-1.5">{["Market Crash", "Technology Sector Drop", "Crypto Volatility Shock", "Custom Scenario"].map((name) => <button key={name} onClick={() => applyScenario(name)} className={`rounded border px-2 py-1 text-[10px] ${scenarioName === name ? "border-cyan-500 text-cyan-300" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>{name}</button>)}</div>
              </>}
              {symbols.map((symbol) => <div key={symbol} className="rounded border border-slate-800 bg-[#0e1626] p-3">
                <div className="mb-2 flex justify-between text-xs"><span className="font-bold text-slate-200">{symbol}</span><span className="text-cyan-300">{(weights[symbol as keyof typeof weights] * 100).toFixed(0)}%</span></div>
                <label className="block text-[10px] text-slate-500">ALLOCATION<input type="range" min="0" max="100" value={weights[symbol as keyof typeof weights] * 100} onChange={(event) => updateWeight(symbol, event.target.value)} className="w-full accent-cyan-500" /></label>
                {tab === "stress" && <label className="mt-2 block text-[10px] text-slate-500">SCENARIO CHANGE %<input type="number" value={changes[symbol as keyof typeof changes]} onChange={(event) => updateChange(symbol, event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-[#080b11] p-1.5 text-slate-200" /></label>}
              </div>)}
              {Math.abs(weightTotal - 1) > 0.0001 && <p className="rounded border border-amber-800/70 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-300">Weights must total 100%. Current: {(weightTotal * 100).toFixed(1)}%</p>}
              <button onClick={run} disabled={isLoading || Math.abs(weightTotal - 1) > 0.0001} className="w-full rounded border border-cyan-700 bg-cyan-950/70 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-50">{isLoading ? "CALCULATING..." : tab === "stress" ? "RUN HYPOTHETICAL SCENARIO" : "CALCULATE PORTFOLIO RISK"}</button>
              <p className="text-[10px] leading-relaxed text-slate-600">{tab === "stress" ? "Hypothetical simulation only. It does not predict future prices." : "Uses overlapping historical market data."}</p>
            </div>
            <ResultPanel result={result} error={error} tab={tab} />
          </div>
        ) : (
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)]">
            <div className="space-y-3">
              <div className="rounded border border-slate-800 bg-[#0e1626] p-3 text-xs"><span className="text-slate-500">ASSET</span><div className="mt-1 text-lg font-bold text-cyan-300">{selectedSymbol}</div></div>
              {tab === "strategies" && <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-500">COST BPS<input type="number" min="0" value={costBps} onChange={(event) => setCostBps(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-700 bg-[#080b11] p-2 text-slate-200" /></label><label className="text-[10px] text-slate-500">SLIPPAGE BPS<input type="number" min="0" value={slippageBps} onChange={(event) => setSlippageBps(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-700 bg-[#080b11] p-2 text-slate-200" /></label></div>}
              <button onClick={run} disabled={isLoading} className="w-full rounded border border-cyan-700 bg-cyan-950/70 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-50">{isLoading ? "RUNNING..." : tab === "strategies" ? "COMPARE STRATEGIES" : "RUN BACKTEST AUDIT"}</button>
            </div>
            <ResultPanel result={result} error={error} tab={tab} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ result, error, tab }: { result: any; error: string; tab: LabTab }) {
  if (error) return <div className="rounded border border-rose-800/70 bg-rose-950/20 p-4 text-xs text-rose-300">{error}</div>;
  if (!result) return <div className="flex min-h-56 items-center justify-center rounded border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600">Run an analysis to see the results.</div>;
  if (tab === "stress") return <div className="space-y-3 rounded border border-slate-800 bg-[#0e1626] p-4"><Metric label="SCENARIO VALUE" value={`$${result.scenario_value.toLocaleString()}`} /><Metric label="P/L" value={`${result.pnl_pct.toFixed(2)}%`} /><Metric label="RECOVERY REQUIRED" value={`${result.recovery_required_pct.toFixed(2)}%`} /><div className="space-y-2 pt-2">{result.contributions.map((item: any) => <div key={item.symbol} className="flex justify-between text-xs"><span className="text-slate-400">{item.symbol}</span><span className={item.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{item.pnl.toFixed(2)}</span></div>)}</div></div>;
  if (tab === "portfolio") return <div className="space-y-3 rounded border border-slate-800 bg-[#0e1626] p-4"><Metric label="PORTFOLIO RETURN" value={`${result.portfolio_return_pct.toFixed(2)}%`} /><Metric label="PORTFOLIO VOLATILITY" value={`${result.portfolio_volatility_pct.toFixed(2)}%`} /><Metric label="MAX DRAWDOWN" value={`${result.portfolio_max_drawdown_pct.toFixed(2)}%`} /><Metric label="CONCENTRATION HHI" value={result.concentration_hhi.toFixed(3)} /><div className="text-[10px] text-slate-500">Analysis: {result.analysis_start} to {result.analysis_end} // {result.data_points} overlapping bars</div></div>;
  if (tab === "strategies") return <div className="min-w-0 space-y-2 rounded border border-slate-800 bg-[#0e1626] p-3 sm:p-4">{result.results.map((item: any) => <div key={item.strategy} className="min-w-0 rounded border border-slate-800 p-3"><div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs font-bold text-cyan-300"><span className="break-words">{item.strategy.toUpperCase()}</span><span className="shrink-0">{item.metrics.total_return_pct.toFixed(2)}%</span></div><div className="grid grid-cols-1 gap-2 text-[10px] text-slate-400 sm:grid-cols-3"><span>SHARPE {item.metrics.sharpe_ratio.toFixed(2)}</span><span>DD {item.metrics.max_drawdown_pct.toFixed(2)}%</span><span>TRADES {item.metrics.number_of_trades}</span></div></div>)}</div>;
  return <div className="space-y-2 rounded border border-slate-800 bg-[#0e1626] p-4">{result.checks.map((check: any) => <div key={check.name} className="flex gap-2 border-b border-slate-800 pb-2 text-xs last:border-0"><span className={check.status === "PASS" ? "text-emerald-400" : check.status === "FAIL" ? "text-rose-400" : "text-amber-400"}>{check.status}</span><div><div className="text-slate-200">{check.name}</div><div className="text-[10px] text-slate-500">{check.evidence}</div></div></div>)}</div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs"><span className="text-slate-500">{label}</span><span className="font-bold text-cyan-300">{value}</span></div>; }