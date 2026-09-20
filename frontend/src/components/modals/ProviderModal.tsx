"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProviders, switchProvider, simulateProviderOutage } from "../../lib/api";
import { X, Server, Check, AlertOctagon, Key, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderModal({ isOpen, onClose }: ProviderModalProps) {
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState<string | null>(null);

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
    enabled: isOpen,
    refetchInterval: 5000,
  });

  const switchMutation = useMutation({
    mutationFn: (providerId: string) => switchProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["systemStatus"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSwitching(null);
    },
  });

  const outageMutation = useMutation({
    mutationFn: (enabled: boolean) => simulateProviderOutage(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["systemStatus"] });
    },
  });

  if (!isOpen) return null;

  const activeProvider = providerData?.active_provider || "yfinance";
  const isOutage = providerData?.simulated_outage || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-cyan-500/40 rounded-xl max-w-2xl w-full p-6 font-mono text-slate-200 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                DATA-PROVIDER REPOSITORY INTERFACE
              </h3>
              <p className="text-xs text-slate-400">
                Live Swappable Ingestion Layer (BaseDataProvider ABC)
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

        {/* Content Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Outage Simulation Alert Banner */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${
            isOutage 
              ? "bg-rose-950/40 border-rose-600 text-rose-300" 
              : "bg-emerald-950/30 border-emerald-700/50 text-emerald-300"
          }`}>
            <div className="flex items-center gap-2">
              {isOutage ? <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>
                {isOutage 
                  ? "SIMULATED OUTAGE ACTIVE: Upstream blocked. Repositories automatically failover to SQLite cache." 
                  : "UPSTREAM PIPELINE: Operational & Healthy."}
              </span>
            </div>
            <button
              onClick={() => outageMutation.mutate(!isOutage)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                isOutage
                  ? "bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-400"
                  : "bg-rose-900/60 hover:bg-rose-800 text-rose-200 border-rose-700"
              }`}
            >
              {isOutage ? "RESTORE UPSTREAM" : "TEST FAILOVER"}
            </button>
          </div>

          {/* Provider Selection Cards */}
          <div className="space-y-2.5">
            <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
              Configured Ingestion Providers:
            </label>

            {providerData?.providers?.map((p: any) => {
              const isSelected = activeProvider === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#141d2e] border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "bg-[#0f1422] border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{p.name}</span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                          ACTIVE SOURCE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Auth: <span className="text-slate-300">{p.auth_type}</span></span>
                      {p.latency_ms && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Zap className="w-3 h-3" /> {p.latency_ms}ms ping
                        </span>
                      )}
                    </div>
                    {p.api_key_masked && (
                      <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        <Key className="w-3 h-3" /> Token: {p.api_key_masked}
                      </div>
                    )}
                  </div>

                  <div>
                    {!isSelected && (
                      <button
                        onClick={() => {
                          setSwitching(p.id);
                          switchMutation.mutate(p.id);
                        }}
                        disabled={switchMutation.isPending}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-cyan-600 hover:text-black border border-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {switching === p.id ? "SWITCHING..." : "ACTIVATE"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture Pipeline Flow */}
          <div className="p-3 bg-[#080c14] border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400 mb-2 font-bold uppercase">
              Decoupled Routing Flow:
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-[#0d121c] p-2.5 rounded border border-slate-800/80">
              <span className="text-cyan-400 font-semibold">FastAPI Engine</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-amber-400 font-semibold">DataProviderFactory</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-emerald-400 font-semibold">BaseDataProvider (ABC)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-purple-400 font-semibold">SQLite Cache</span>
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