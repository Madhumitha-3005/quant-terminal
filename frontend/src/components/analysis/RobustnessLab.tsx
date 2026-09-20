"use client";

import { Fragment, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FlaskConical, Loader2, X } from "lucide-react";
import { compareStrategies, generateBacktestReport, getMonteCarloBands, getStrategyRobustness } from "../../lib/api";
import { ToastTone } from "../feedback/Toast";

type Tab = "heatmap" | "monte-carlo" | "report";
interface RobustnessLabProps { isOpen: boolean; symbol: string; onClose: () => void; onNotify: (message: string, tone: ToastTone) => void; }

export default function RobustnessLab({ isOpen, symbol, onClose, onNotify }: RobustnessLabProps) {
  const [tab, setTab] = useState<Tab>("heatmap");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [robustness, setRobustness] = useState<any>(null);
  const [monteCarlo, setMonteCarlo] = useState<any>(null);
  const [report, setReport] = useState("");
  const [reportMetrics, setReportMetrics] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  const run = async () => {
    setLoading(true); setError("");
    try {
      if (tab === "heatmap") setRobustness(await getStrategyRobustness(symbol, strategy));
      if (tab === "monte-carlo") setMonteCarlo(await getMonteCarloBands(symbol, strategy, 500));
      if (tab === "report") {
        const comparison = await compareStrategies(symbol, 0, 0);
        const metrics = comparison.results?.find((item: { strategy: string }) => item.strategy === strategy)?.metrics || comparison.results?.[0]?.metrics || {};
        const generated = await generateBacktestReport(symbol, strategy, metrics);
        setReport(generated.answer); setReportMetrics(metrics);
      }
      onNotify("Analysis completed successfully.", "success");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Analysis failed";
      setError(message); onNotify(message, "error");
    } finally { setLoading(false); }
  };
  const downloadReport = () => {
    if (!report || !reportMetrics) return;
    const content = `# QUANT_TERMINAL Backtest Report\n\nAsset: ${symbol}\nStrategy: ${strategy}\n\n## Summary\n${report}\n\n## Computed Metrics\n${Object.entries(reportMetrics).map(([key, value]) => `- ${key}: ${value}`).join("\n")}\n\nHistorical results do not guarantee future performance.\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = `${symbol}-${strategy}-report.md`; link.click(); URL.revokeObjectURL(url);
  };
  const values = robustness?.sharpe_grid?.flat().filter((value: number | null): value is number => value !== null) || [];
  const min = values.length ? Math.min(...values) : 0; const max = values.length ? Math.max(...values) : 1;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-emerald-800/70 bg-[#0b101b] p-5 font-mono text-slate-200 shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-800 pb-4"><div className="flex items-center gap-2"><div className="rounded border border-emerald-700/70 bg-emerald-950/50 p-2 text-emerald-300"><FlaskConical className="h-5 w-5" /></div><div><h2 className="text-sm font-bold tracking-wider text-emerald-300">ROBUSTNESS & REPORT LAB</h2><p className="mt-1 text-[11px] text-slate-500">Overfitting awareness, simulated ranges, and plain-English export</p></div></div><button onClick={onClose} aria-label="Close robustness lab" className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button></div>
      <div className="mt-4 grid grid-cols-3 border-b border-slate-800">{(["heatmap", "monte-carlo", "report"] as Tab[]).map((item) => <button key={item} onClick={() => { setTab(item); setError(""); }} className={`border-b-2 px-2 py-2 text-[10px] font-bold ${tab === item ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500"}`}>{item === "heatmap" ? "ROBUSTNESS HEATMAP" : item === "monte-carlo" ? "MONTE CARLO BANDS" : "GENERATE REPORT"}</button>)}</div>
      <div className="mt-4 flex items-center justify-between gap-3"><label className="text-[10px] text-slate-500">STRATEGY<select value={strategy} onChange={(event) => setStrategy(event.target.value)} className="ml-2 rounded border border-slate-700 bg-[#080b11] p-2 text-xs text-slate-200"><option value="sma_crossover">SMA Crossover</option><option value="momentum">Momentum</option>{tab !== "heatmap" && <option value="buy_and_hold">Buy and Hold</option>}</select></label><button onClick={run} disabled={loading} className="flex items-center gap-2 rounded border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{loading ? "RUNNING..." : tab === "report" ? "GENERATE REPORT" : "RUN ANALYSIS"}</button></div>
      {error && <div className="mt-3 rounded border border-rose-800/70 bg-rose-950/20 p-3 text-xs text-rose-300">{error}</div>}
      {!error && tab === "heatmap" && <Heatmap result={robustness} min={min} max={max} />}
      {!error && tab === "monte-carlo" && <MonteCarloChart result={monteCarlo} />}
      {!error && tab === "report" && <div className="mt-4 space-y-3">{report ? <><div className="rounded border border-slate-800 bg-[#0e1626] p-4 text-sm leading-7 text-slate-300">{report}</div><button onClick={downloadReport} className="flex items-center gap-2 rounded border border-cyan-700 px-3 py-2 text-xs text-cyan-300"><Download className="h-3.5 w-3.5" /> DOWNLOAD MARKDOWN REPORT</button></> : <Empty text="Generate a report from the selected strategy's metrics." />}</div>}
    </div>
  </div>;
}

function Heatmap({ result, min, max }: { result: any; min: number; max: number }) {
  if (!result) return <Empty text="Choose a strategy and run the parameter grid." />;
  const columns = `minmax(150px, 1.4fr) repeat(${result.slow_periods.length}, minmax(88px, 1fr))`;
  const colorFor = (value: number | null) => {
    if (value === null) return "#111827";
    const intensity = 0.2 + ((value - min) / Math.max(max - min, 0.01)) * 0.75;
    return `rgba(16, 185, 129, ${Math.max(0.2, Math.min(0.95, intensity))})`;
  };

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs leading-relaxed text-slate-400">{result.explanation}</p>
      <div className="overflow-x-auto rounded border border-slate-800 bg-[#0e1626] p-2">
        <div className="min-w-[650px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: columns }}>
            <div className="flex items-end px-2 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{result.x_label} / {result.y_label}</div>
            {result.slow_periods.map((period: number) => (
              <div key={period} className="flex min-h-10 items-end justify-center px-1 pb-2 text-center text-[10px] font-bold text-slate-400">{result.y_label} {period}</div>
            ))}
            {result.sharpe_grid.map((row: (number | null)[], index: number) => (
              <Fragment key={result.fast_periods[index]}>
                <div className="flex min-h-12 items-center justify-end rounded bg-[#101a2b] px-3 text-right text-[10px] font-bold text-slate-400">{result.x_label} {result.fast_periods[index]}</div>
                {row.map((value, cellIndex) => (
                  <div key={cellIndex} className="flex min-h-12 items-center justify-center rounded border border-slate-900 text-xs font-bold text-slate-100" style={{ backgroundColor: colorFor(value) }}>
                    {value === null ? "-" : value.toFixed(2)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>Lower Sharpe</span><span>Higher Sharpe</span></div>
    </div>
  );
}
function MonteCarloChart({ result }: { result: any }) { if (!result) return <Empty text="Run the bootstrap simulation to generate percentile bands." />; const chartData = result.bands.map((point: any, index: number) => ({ ...point, historical: result.historical_equity?.[index]?.value })); return <div className="mt-4"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" /><XAxis dataKey="step" stroke="#64748b" fontSize={10} /><YAxis stroke="#64748b" fontSize={10} /><Tooltip /><Area type="monotone" dataKey="p90" stroke="#34d399" fill="#34d399" fillOpacity={0.12} /><Area type="monotone" dataKey="p10" stroke="#fb7185" fill="#fb7185" fillOpacity={0.16} /><Area type="monotone" dataKey="median" stroke="#22d3ee" fill="none" /><Area type="monotone" dataKey="historical" stroke="#fbbf24" fill="none" /></AreaChart></ResponsiveContainer></div><p className="mt-3 rounded border border-amber-800/70 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-200">{result.disclaimer}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="mt-4 flex min-h-56 items-center justify-center rounded border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600">{text}</div>; }