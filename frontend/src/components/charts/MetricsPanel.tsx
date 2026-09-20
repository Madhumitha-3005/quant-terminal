"use client";

import React, { ReactNode } from "react";
import { QuantitativeMetrics } from "../../types";
import { Gauge, ShieldAlert, Award, Percent, Calendar, Database } from "lucide-react";

interface MetricsPanelProps {
  metrics?: QuantitativeMetrics;
  symbol: string;
  timeframe: string;
  isLoading?: boolean;
}

interface MetricCardProps {
  label: string;
  detail: string;
  children: ReactNode;
}

function MetricCard({ label, detail, children }: MetricCardProps) {
  return (
    <div
      tabIndex={0}
      aria-label={`${label}: ${detail}`}
      className="group relative rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
    >
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[min(240px,calc(100vw-2rem))] -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <div className="rounded border border-cyan-700/70 bg-[#101a2b] px-3 py-2 text-[10px] leading-relaxed text-slate-300 shadow-xl shadow-black/40">
          <div className="mb-0.5 font-bold tracking-wide text-cyan-300">{label}</div>
          {detail}
        </div>
        <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-cyan-700/70 bg-[#101a2b]" />
      </div>
      {children}
    </div>
  );
}

export default function MetricsPanel({
  metrics,
  symbol,
  timeframe,
  isLoading,
}: MetricsPanelProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-20 bg-slate-900/60 border border-slate-800 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isReturnPos = metrics.total_return_pct >= 0;
  const isSharpeGood = metrics.sharpe_ratio >= 1.0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 font-mono">
      {/* Total Return */}
      <MetricCard label="TOTAL RETURN" detail="Cumulative percentage gain or loss over the selected period. CAGR annualizes that result for comparison.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>TOTAL RETURN</span>
          <Percent className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div
          className={`text-base sm:text-lg font-extrabold tabular-nums ${
            isReturnPos ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isReturnPos ? "+" : ""}
          {metrics.total_return_pct.toFixed(2)}%
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          CAGR: {metrics.cagr_pct.toFixed(1)}%
        </div>
        </div>
      </MetricCard>

      {/* Sharpe Ratio */}
      <MetricCard label="SHARPE RATIO" detail="Return earned per unit of volatility after the 4% annual risk-free rate. Higher is generally better, but it is not a guarantee.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>SHARPE RATIO</span>
          <Award className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div
          className={`text-base sm:text-lg font-extrabold tabular-nums ${
            isSharpeGood ? "text-amber-300" : "text-slate-200"
          }`}
        >
          {metrics.sharpe_ratio.toFixed(2)}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Rf = 4.0% p.a.</div>
        </div>
      </MetricCard>

      {/* Annualized Volatility */}
      <MetricCard label="ANN. VOLATILITY" detail="Estimated annualized variability of returns. It describes uncertainty, not whether returns are positive or negative.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>ANN. VOLATILITY</span>
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-base sm:text-lg font-extrabold text-cyan-300 tabular-nums">
          {metrics.annualized_volatility_pct.toFixed(2)}%
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {symbol === "BTC" ? "365-day crypto" : "252-day market"}
        </div>
        </div>
      </MetricCard>

      {/* Max Drawdown */}
      <MetricCard label="MAX DRAWDOWN" detail="Largest peak-to-trough decline in the selected period. It shows the worst historical loss from a previous high.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>MAX DRAWDOWN</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-base sm:text-lg font-extrabold text-rose-400 tabular-nums">
          {metrics.max_drawdown_pct.toFixed(2)}%
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Peak-to-trough</div>
        </div>
      </MetricCard>

      {/* Sortino Ratio */}
      <MetricCard label="SORTINO RATIO" detail="Risk-adjusted return using downside volatility only, so harmful fluctuations matter more than upside variation.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>SORTINO RATIO</span>
          <Award className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-base sm:text-lg font-extrabold text-purple-300 tabular-nums">
          {metrics.sortino_ratio.toFixed(2)}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Downside risk only</div>
        </div>
      </MetricCard>

      {/* Data Range / Observations */}
      <MetricCard label="SAMPLE SIZE" detail="Number of historical bars used in the calculation, alongside the exact start and end dates of the sample.">
        <div className="h-full rounded-lg border border-slate-800/80 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>SAMPLE SIZE</span>
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-base sm:text-lg font-extrabold text-slate-200 tabular-nums">
          {metrics.data_points} <span className="text-xs font-normal text-slate-400">bars</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
          {metrics.start_date} → {metrics.end_date}
        </div>
        </div>
      </MetricCard>
    </div>
  );
}