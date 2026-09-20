"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AssetOverview } from "../../types";

interface TickerBarProps {
  assets: AssetOverview[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLoading?: boolean;
  currency: string;
  conversionRate: number;
  onCurrencyChange: (currency: string) => void;
}

export default function TickerBar({
  assets,
  selectedSymbol,
  onSelectSymbol,
  isLoading,
  currency,
  conversionRate,
  onCurrencyChange,
}: TickerBarProps) {
  if (isLoading && (!assets || assets.length === 0)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-slate-900/60 border border-slate-800 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold tracking-wider text-slate-500">DISPLAY CURRENCY</span>
        <label className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
          <span className="sr-only">Display currency</span>
          <select
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            className="rounded border border-slate-700 bg-[#0d131f] px-2.5 py-1.5 text-xs text-cyan-300 outline-none focus:border-cyan-500"
          >
            <option value="USD">US Dollar (USD)</option>
            <option value="INR">Indian Rupee (INR)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3">
      {assets.map((asset) => {
        const isSelected = selectedSymbol.toUpperCase() === asset.symbol.toUpperCase();
        const isPositive = asset.change_24h_pct >= 0;

        return (
          <button
            key={asset.symbol}
            onClick={() => onSelectSymbol(asset.symbol)}
            className={`flex h-full min-h-[112px] min-w-0 flex-col items-stretch gap-2 rounded-lg border p-3.5 text-left transition-all ${
              isSelected
                ? "bg-[#141d2e] border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30"
                : "bg-[#0d131f] border-slate-800 hover:border-slate-700 hover:bg-[#121927]"
            }`}
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              {asset.symbol === "GOLD" ? "COMMODITY" : asset.symbol === "BTC" ? "CRYPTOCURRENCY" : "STOCK"}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center space-x-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-slate-100">
                    {asset.symbol}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[160px]">
                  {asset.name}
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right font-mono">
              <div className="text-base font-extrabold text-slate-100 tabular-nums">
                {currency === "USD" ? "$" : currency === "INR" ? "₹" : currency === "EUR" ? "€" : "£"}{(asset.latest_price * conversionRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                className={`text-xs flex items-center justify-end font-semibold tabular-nums gap-1 ${
                  isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {asset.change_24h_pct.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400">
                  ({isPositive ? "+" : ""}{currency === "USD" ? "$" : currency === "INR" ? "₹" : currency === "EUR" ? "€" : "£"}{(asset.change_24h * conversionRate).toFixed(2)})
                </span>
              </div>
            </div>
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}