"use client";

import React from "react";
import { Activity, ShieldCheck, Database, KeyRound, Cpu, LogOut } from "lucide-react";
import { SystemStatus } from "../../types";

interface HeaderProps {
  status?: SystemStatus;
  isLoading?: boolean;
  onLogout?: () => void;
}

export default function Header({ status, isLoading, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-slate-800/80 bg-[#0c101a]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/60 px-2.5 py-1 rounded">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
            <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 ml-1">
              LIVE
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono font-extrabold text-sm md:text-base tracking-wider text-slate-100 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                QUANT_TERMINAL
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                HACKATHON ED.
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Multi-Asset Quantitative Engine & Execution Lab
            </p>
          </div>
        </div>

        {/* System & Architecture Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Data Layer Status */}
          <div className="flex items-center gap-1.5 bg-[#121826] border border-slate-700/80 px-2.5 py-1 rounded text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">DATA:</span>
            <span className="text-cyan-300 font-semibold">
              {status?.active_provider ? status.active_provider.toUpperCase() : "SQLITE / YF"}
            </span>
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 px-1 rounded">
              REAL OHLCV
            </span>
          </div>

          {/* API Key Auth */}
          <div className="flex items-center gap-1.5 bg-[#121826] border border-slate-700/80 px-2.5 py-1 rounded text-slate-300">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">AUTH:</span>
            <span className="text-amber-300">rc_5dd...6d3</span>
            <span className="text-[10px] text-emerald-400 font-bold">✓</span>
          </div>

          {/* Look-ahead Bias Prevention */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#121826] border border-slate-700/80 px-2.5 py-1 rounded text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">CAUSAL / NO LOOK-AHEAD</span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded border border-slate-700/80 bg-[#121826] px-2.5 py-1 text-slate-400 transition-colors hover:border-rose-500/70 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}