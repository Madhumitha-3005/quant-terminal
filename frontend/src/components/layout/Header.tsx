"use client";

import React from "react";
import { Cpu, LogOut } from "lucide-react";

interface HeaderProps {
  isLoading?: boolean;
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
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
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Multi-Asset Research Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
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