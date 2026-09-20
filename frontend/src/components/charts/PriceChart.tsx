"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PriceBar } from "../../types";
import { Eye, EyeOff, BarChart2 } from "lucide-react";

interface PriceChartProps {
  bars: PriceBar[];
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  isLoading?: boolean;
}

export default function PriceChart({
  bars,
  symbol,
  timeframe,
  onTimeframeChange,
  isLoading,
}: PriceChartProps) {
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  const timeframes = ["1M", "6M", "1Y", "3Y", "5Y", "ALL"];

  if (isLoading || !bars || bars.length === 0) {
    return (
      <div className="w-full h-[520px] bg-[#0c101a] border border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs text-slate-400">
          STREAMING REAL OHLCV FOR {symbol}...
        </p>
      </div>
    );
  }

  const prices = bars.map((b) => b.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.05 || 1.0;
  const yDomain = [Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)];
  const maxVol = Math.max(...bars.map((b) => b.volume)) || 1.0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: PriceBar = payload[0].payload;
      return (
        <div className="bg-[#0b101b]/95 border border-slate-700/80 p-3 rounded shadow-2xl font-mono text-xs z-50 min-w-[210px] backdrop-blur-md">
          <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
            <span>{data.timestamp}</span>
            <span className="text-slate-400">{symbol}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">CLOSE:</span>
              <span className="text-cyan-300 font-bold">${data.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>O / H / L:</span>
              <span>
                ${data.open.toFixed(1)} / ${data.high.toFixed(1)} / ${data.low.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>VOLUME:</span>
              <span>{data.volume.toLocaleString()}</span>
            </div>
            {showSMA20 && data.sma_20 && (
              <div className="flex justify-between text-[#facc15]">
                <span>SMA 20:</span>
                <span>${data.sma_20.toFixed(2)}</span>
              </div>
            )}
            {showSMA50 && data.sma_50 && (
              <div className="flex justify-between text-[#fb923c]">
                <span>SMA 50:</span>
                <span>${data.sma_50.toFixed(2)}</span>
              </div>
            )}
            {showEMA20 && data.ema_20 && (
              <div className="flex justify-between text-[#4ade80]">
                <span>EMA 20:</span>
                <span>${data.ema_20.toFixed(2)}</span>
              </div>
            )}
            {showEMA50 && data.ema_50 && (
              <div className="flex justify-between text-[#c084fc]">
                <span>EMA 50:</span>
                <span>${data.ema_50.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">DRAWDOWN:</span>
              <span className="text-rose-400 font-semibold">{data.drawdown_pct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-4 font-mono shadow-lg">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-1 bg-[#101625] p-1 rounded border border-slate-800">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs rounded font-bold transition-all ${
                timeframe === tf
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
              showSMA20
                ? "bg-[#292209] border-[#facc15]/80 text-[#facc15]"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            {showSMA20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            SMA 20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
              showSMA50
                ? "bg-[#29160a] border-[#fb923c]/80 text-[#fb923c]"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            {showSMA50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            SMA 50
          </button>

          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
              showEMA20
                ? "bg-[#0c2415] border-[#4ade80]/80 text-[#4ade80]"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            {showEMA20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            EMA 20
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
              showEMA50
                ? "bg-[#201033] border-[#c084fc]/80 text-[#c084fc]"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            {showEMA50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            EMA 50
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-all ${
              showVolume
                ? "bg-cyan-950 border-cyan-700/60 text-cyan-300"
                : "bg-slate-900/60 border-slate-800 text-slate-500"
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            VOL
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="w-full h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={bars}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
              opacity={0.6}
            />

            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={(str) => {
                if (!str) return "";
                const parts = str.split("-");
                return `${parts[1]}/${parts[0]?.slice(2)}`;
              }}
              minTickGap={40}
            />

            <YAxis
              domain={yDomain}
              stroke="#64748b"
              fontSize={10}
              orientation="right"
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
            />

            <YAxis
              yAxisId="volume"
              domain={[0, maxVol * 4.5]}
              orientation="left"
              hide={true}
            />

            <Tooltip content={<CustomTooltip />} />

            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#334155"
                opacity={0.35}
                maxBarSize={6}
              />
            )}

            {/* Area gradient under price */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="none"
              fill="url(#priceGradient)"
              baseValue="dataMin"
              isAnimationActive={false}
            />

            {/* Solid high-visibility price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#00e5ff"
              strokeWidth={2.0}
              dot={false}
              isAnimationActive={false}
            />

            {/* SMA 20 */}
            {showSMA20 && (
              <Line
                type="monotone"
                dataKey="sma_20"
                stroke="#facc15"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* SMA 50 */}
            {showSMA50 && (
              <Line
                type="monotone"
                dataKey="sma_50"
                stroke="#fb923c"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* EMA 20 */}
            {showEMA20 && (
              <Line
                type="monotone"
                dataKey="ema_20"
                stroke="#4ade80"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* EMA 50 */}
            {showEMA50 && (
              <Line
                type="monotone"
                dataKey="ema_50"
                stroke="#c084fc"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend / Active Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <span className="w-2.5 h-0.5 bg-[#00e5ff]" /> NVDA Close
          </span>
          {showSMA20 && (
            <span className="flex items-center gap-1.5 text-[#facc15]">
              <span className="w-2.5 h-0.5 bg-[#facc15]" /> SMA 20
            </span>
          )}
          {showSMA50 && (
            <span className="flex items-center gap-1.5 text-[#fb923c]">
              <span className="w-2.5 h-0.5 bg-[#fb923c]" /> SMA 50
            </span>
          )}
          {showEMA20 && (
            <span className="flex items-center gap-1.5 text-[#4ade80]">
              <span className="w-2.5 h-0.5 bg-[#4ade80]" /> EMA 20
            </span>
          )}
          {showEMA50 && (
            <span className="flex items-center gap-1.5 text-[#c084fc]">
              <span className="w-2.5 h-0.5 bg-[#c084fc]" /> EMA 50
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-500">
          REAL OHLCV DATA SOURCE: YAHOO FINANCE & SQLITE REPO
        </div>
      </div>
    </div>
  );
}