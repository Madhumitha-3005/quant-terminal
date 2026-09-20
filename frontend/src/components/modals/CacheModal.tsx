"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCacheDiagnostics, toggleOfflineMode, syncCacheNow } from "../../lib/api";
import { X, Database, HardDrive, Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

interface CacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CacheModal({ isOpen, onClose }: CacheModalProps) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const { data: cacheData, isLoading } = useQuery({
    queryKey: ["cacheDiagnostics"],
    queryFn: getCacheDiagnostics,
    enabled: isOpen,
    refetchInterval: 3000,
  });

  const offlineMutation = useMutation({
    mutationFn: (enabled: boolean) => toggleOfflineMode(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cacheDiagnostics"] });
      queryClient.invalidateQueries({ queryKey: ["systemStatus"] });
    },
  });

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncCacheNow();
      setSyncSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["cacheDiagnostics"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  const isOffline = cacheData?.simulated_offline || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-emerald-500/40 rounded-xl max-w-2xl w-full p-6 font-mono text-slate-200 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                OFFLINE PERSISTENCE & SQLITE LAYER
              </h3>
              <p className="text-xs text-slate-400">
                Embedded SQLite Cache (`market_cache.db`)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Offline Mode Banner & Interactive Toggle */}
          <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
            isOffline
              ? "bg-amber-950/40 border-amber-600 text-amber-300"
              : "bg-[#0e1626] border-slate-700/80 text-slate-300"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${isOffline ? "bg-amber-900/60 text-amber-300" : "bg-cyan-950 text-cyan-400"}`}>
                {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-slate-100">
                  {isOffline ? "SIMULATED OFFLINE MODE (AIRPLANE MODE)" : "ONLINE MODE (LIVE NETWORK)"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isOffline 
                    ? "External calls blocked. Charts & indicators load in <3ms 100% from SQLite."
                    : "Serves from cache first, refreshes delta from provider when needed."}
                </div>
              </div>
            </div>

            <button
              onClick={() => offlineMutation.mutate(!isOffline)}
              disabled={offlineMutation.isPending}
              className={`px-3 py-1.5 rounded font-bold border transition-all text-xs ${
                isOffline
                  ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
              }`}
            >
              {isOffline ? "DISABLE OFFLINE" : "TEST OFFLINE MODE"}
            </button>
          </div>

          {/* SQLite Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-lg">
              <div className="text-slate-400 text-[10px] mb-1">TOTAL BARS</div>
              <div className="text-base font-bold text-emerald-400">
                {cacheData?.total_bars?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-lg">
              <div className="text-slate-400 text-[10px] mb-1">DISK USAGE</div>
              <div className="text-base font-bold text-cyan-400">
                {cacheData?.db_size_kb || 0} KB
              </div>
            </div>
            <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-lg">
              <div className="text-slate-400 text-[10px] mb-1">CACHE HITS</div>
              <div className="text-base font-bold text-amber-400">
                {cacheData?.cache_hits || 0}
              </div>
            </div>
            <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-lg">
              <div className="text-slate-400 text-[10px] mb-1">HIT RATIO</div>
              <div className="text-base font-bold text-purple-400">
                {cacheData?.hit_ratio_pct || 0}%
              </div>
            </div>
          </div>

          {/* Table Breakdown per Asset */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-[#121826] px-3 py-2 text-[11px] font-bold text-slate-300 border-b border-slate-800 flex justify-between items-center">
              <span>CACHED ASSET PARTITIONS</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "SYNCING..." : "RE-SYNC ALL"}</span>
              </button>
            </div>
            {syncSuccess && (
              <div className="bg-emerald-950/60 text-emerald-300 text-[11px] p-2 flex items-center gap-1.5 border-b border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All partitions resynchronized and verified!</span>
              </div>
            )}
            <div className="divide-y divide-slate-800/80 bg-[#0d121c]">
              {cacheData?.symbols &&
                Object.entries(cacheData.symbols).map(([sym, stats]: [string, any]) => (
                  <div key={sym} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{sym}</div>
                      <div className="text-[10px] text-slate-400">
                        {stats.min_date} → {stats.max_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{stats.count} bars</div>
                      <div className="text-[10px] text-slate-500">Persistent SQLite</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}