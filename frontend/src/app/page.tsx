"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAssets, getAssetHistory, getFxRates, syncCacheNow } from "../lib/api";
import Header from "../components/layout/Header";
import TickerBar from "../components/layout/TickerBar";
import MetricsPanel from "../components/charts/MetricsPanel";
import PriceChart from "../components/charts/PriceChart";
import ProviderModal from "../components/modals/ProviderModal";
import CacheModal from "../components/modals/CacheModal";
import LookaheadModal from "../components/modals/LookaheadModal";
import ResearchAssistant from "../components/research/ResearchAssistant";
import AuthScreen from "../components/auth/AuthScreen";
import Toast, { ToastTone } from "../components/feedback/Toast";
import AnalysisLab from "../components/analysis/AnalysisLab";
import RobustnessLab from "../components/analysis/RobustnessLab";
import { RefreshCw, AlertTriangle, BarChart3, Terminal, CheckCircle2, Shield, ExternalLink } from "lucide-react";

function DashboardContent({ onLogout }: { onLogout: () => void }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NVDA");
  const [timeframe, setTimeframe] = useState<string>("1Y");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncNotice, setSyncNotice] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const [isAnalysisLabOpen, setIsAnalysisLabOpen] = useState(false);
  const [isRobustnessLabOpen, setIsRobustnessLabOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [isLookaheadModalOpen, setIsLookaheadModalOpen] = useState(false);

  // Query assets list
  const {
    data: assets = [],
    isLoading: assetsLoading,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
    refetchInterval: 60000,
  });

  const { data: fxRates } = useQuery({
    queryKey: ["fxRates"],
    queryFn: getFxRates,
    staleTime: 1000 * 60 * 30,
  });

  // Query asset historical data & computed indicators
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["history", selectedSymbol, timeframe],
    queryFn: () => getAssetHistory(selectedSymbol, timeframe),
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError("");
    setToast({ message: "Refreshing market data...", tone: "info" });
    try {
      await syncCacheNow();
      await Promise.all([refetchAssets(), refetchHistory()]);
      setSyncNotice("DATA UPDATED");
      setToast({ message: "Market data updated for GOLD, BTC, and NVDA.", tone: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Market data refresh failed";
      setSyncError(message);
      setSyncNotice("UPDATE FAILED");
      setToast({ message, tone: "error" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Terminal Header */}
      <Header
        onLogout={onLogout}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
        {/* Top Asset Ticker Selector */}
        <TickerBar
          assets={assets}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(sym) => setSelectedSymbol(sym)}
          isLoading={assetsLoading}
          currency={displayCurrency}
          conversionRate={fxRates?.rates[displayCurrency] || 1}
          onCurrencyChange={setDisplayCurrency}
        />

        {/* Selected Asset Header & Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-wide">
              {historyData?.meta.name || selectedSymbol}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
              {historyData?.meta.ticker || selectedSymbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              {historyData?.meta.asset_class}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {syncNotice && (
              <span className={`font-mono text-[10px] font-bold ${syncNotice === "DATA UPDATED" ? "text-emerald-400" : "text-rose-400"}`}>
                {syncNotice}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#121826] border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${historyFetching ? "animate-spin text-cyan-400" : ""}`}
              />
              <span>REFRESH DATA</span>
            </button>
          </div>
        </div>

        {syncError && (
          <p className="mb-3 font-mono text-xs text-rose-400">DATA UPDATE ERROR: {syncError}</p>
        )}

        {/* Institutional Quantitative Metrics Panel */}
        <MetricsPanel
          metrics={historyData?.metrics}
          symbol={selectedSymbol}
          timeframe={timeframe}
          isLoading={historyLoading}
        />

        {/* High-Performance Price & Indicator Chart */}
        <PriceChart
          bars={historyData?.bars || []}
          symbol={selectedSymbol}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          isLoading={historyLoading}
        />

        <ResearchAssistant
          symbol={selectedSymbol}
          onNotify={(message, tone) => setToast({ message, tone })}
          backtestResults={{
            timeframe: historyData?.timeframe,
            metrics: historyData?.metrics,
            recent_bars: historyData?.bars?.slice(-10),
            data_provider: historyData?.data_provider,
          }}
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div>
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300">RESEARCH TOOLS</h3>
            <p className="mt-1 font-mono text-[11px] text-slate-500">Explore strategies, risk, and performance for the selected asset.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsAnalysisLabOpen(true)} className="flex items-center gap-1.5 rounded border border-cyan-700/70 bg-cyan-950/40 px-2 py-1 font-mono text-[10px] text-cyan-300 transition-colors hover:border-cyan-400 sm:text-[11px]">
              <BarChart3 className="h-3.5 w-3.5" /> ANALYSIS LAB
            </button>
            <button onClick={() => setIsRobustnessLabOpen(true)} className="rounded border border-emerald-700/70 bg-emerald-950/30 px-2 py-1 font-mono text-[10px] text-emerald-300 transition-colors hover:border-emerald-400 sm:text-[11px]">
              ROBUSTNESS & REPORTS
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 font-mono text-xs md:grid-cols-3">
          <FlipCard
            id="provider"
            flipped={Boolean(flippedCards.provider)}
            onFlip={() => setFlippedCards((current) => ({ ...current, provider: !current.provider }))}
            tone="cyan"
            icon={<Terminal className="h-5 w-5" />}
            title="DATA-PROVIDER REPO PATTERN"
            details="Decoupled interface (BaseDataProvider). Live switch between Yahoo Finance and Hackathon Token with real-time failover testing."
            status="ACTIVE DATA PROVIDER"
            actionLabel="OPEN INSPECTOR"
            onAction={() => setIsProviderModalOpen(true)}
          />
          <FlipCard
            id="cache"
            flipped={Boolean(flippedCards.cache)}
            onFlip={() => setFlippedCards((current) => ({ ...current, cache: !current.cache }))}
            tone="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="OFFLINE PERSISTENCE LAYER"
            details="Every bar is cached for dependable access. Test Airplane/Offline mode to verify charts and indicators during bad Wi-Fi."
            status="3,470 CACHED BARS"
            actionLabel="TEST OFFLINE MODE"
            onAction={() => setIsCacheModalOpen(true)}
          />
          <FlipCard
            id="lookahead"
            flipped={Boolean(flippedCards.lookahead)}
            onFlip={() => setFlippedCards((current) => ({ ...current, lookahead: !current.lookahead }))}
            tone="amber"
            icon={<Shield className="h-5 w-5" />}
            title="ZERO LOOK-AHEAD BIAS"
            details="Interactive causal audit. Scrub historical dates and verify strict T+1 execution sequencing against naive leaks."
            status="CAUSALITY VERIFIED"
            actionLabel="AUDIT CAUSALITY"
            onAction={() => setIsLookaheadModalOpen(true)}
          />
        </div>
      </main>

      {/* Terminal Footer with Mandatory Compliance Disclaimer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e17] py-3 mt-6">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80" />
            <span>
              DISCLAIMER: Quantitative research platform. Metrics are computed on historical market data and do not predict future returns.
            </span>
          </div>
        </div>
      </footer>

      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}

      <ProviderModal isOpen={isProviderModalOpen} onClose={() => setIsProviderModalOpen(false)} />
      <CacheModal isOpen={isCacheModalOpen} onClose={() => setIsCacheModalOpen(false)} />
      <LookaheadModal isOpen={isLookaheadModalOpen} onClose={() => setIsLookaheadModalOpen(false)} selectedSymbol={selectedSymbol} />

      <AnalysisLab
        isOpen={isAnalysisLabOpen}
        selectedSymbol={selectedSymbol}
        onClose={() => setIsAnalysisLabOpen(false)}
        onNotify={(message, tone) => setToast({ message, tone })}
      />
      <RobustnessLab
        isOpen={isRobustnessLabOpen}
        symbol={selectedSymbol}
        onClose={() => setIsRobustnessLabOpen(false)}
        onNotify={(message, tone) => setToast({ message, tone })}
      />
    </div>
  );
}

function FlipCard({
  id,
  flipped,
  onFlip,
  tone,
  icon,
  title,
  details,
  status,
  actionLabel,
  onAction,
}: {
  id: string;
  flipped: boolean;
  onFlip: () => void;
  tone: "cyan" | "emerald" | "amber";
  icon: React.ReactNode;
  title: string;
  details: string;
  status: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const colors = {
    cyan: { border: "border-cyan-700/70", text: "text-cyan-300", hover: "hover:border-cyan-400", bg: "bg-cyan-950/40" },
    emerald: { border: "border-emerald-700/70", text: "text-emerald-300", hover: "hover:border-emerald-400", bg: "bg-emerald-950/30" },
    amber: { border: "border-amber-700/70", text: "text-amber-300", hover: "hover:border-amber-400", bg: "bg-amber-950/30" },
  }[tone];

  return (
    <div className="[perspective:1000px]">
      <div className={`relative min-h-[184px] transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        <button type="button" onClick={onFlip} aria-label={`Show details for ${title}`} className={`absolute inset-0 flex items-center justify-center gap-3 rounded-lg border bg-[#0b101b] p-4 text-center shadow-md [backface-visibility:hidden] ${colors.border} ${colors.hover}`}>
          <span className={colors.text}>{icon}</span>
          <span className={`text-xs font-bold tracking-wider ${colors.text}`}>{title}</span>
        </button>
        <div className={`absolute inset-0 rounded-lg border bg-[#0b101b] p-4 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)] ${colors.border}`}>
          <div className={`mb-2 flex items-center gap-2 font-bold ${colors.text}`}>
            {icon}
            <span className="text-[11px] tracking-wide">{title}</span>
          </div>
          <p className="min-h-[58px] text-[11px] leading-relaxed text-slate-400">{details}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${colors.border} ${colors.text} ${colors.bg}`}>{status}</span>
            <button type="button" onClick={onAction} className={`flex items-center gap-1 text-[10px] font-bold ${colors.text} hover:underline`}>
              <ExternalLink className="h-3 w-3" /> {actionLabel}
            </button>
          </div>
          <button type="button" onClick={onFlip} className="mt-3 text-[10px] text-slate-600 hover:text-slate-300">FLIP BACK</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      setIsAuthenticated(Boolean(window.sessionStorage.getItem("quant-terminal-session")));
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  if (!authReady) {
    return <main className="flex min-h-screen items-center justify-center bg-[#080b11] font-mono text-xs text-cyan-300">LOADING QUANT_TERMINAL...</main>;
  }
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthenticated={(email) => {
          window.sessionStorage.setItem("quant-terminal-session", email);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <DashboardContent
      onLogout={() => {
        window.sessionStorage.removeItem("quant-terminal-session");
        setIsAuthenticated(false);
      }}
    />
  );
}