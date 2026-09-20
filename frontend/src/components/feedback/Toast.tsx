"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
  message: string;
  tone: ToastTone;
  onClose: () => void;
}

const toneStyles = {
  success: {
    icon: CheckCircle2,
    border: "border-emerald-700/70",
    iconColor: "text-emerald-400",
  },
  error: {
    icon: XCircle,
    border: "border-rose-700/70",
    iconColor: "text-rose-400",
  },
  info: {
    icon: Info,
    border: "border-cyan-700/70",
    iconColor: "text-cyan-400",
  },
};

export default function Toast({ message, tone, onClose }: ToastProps) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  useEffect(() => {
    const timeout = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  return (
    <div className={`fixed right-5 top-20 z-[60] flex max-w-sm items-start gap-2.5 rounded-lg border ${style.border} bg-[#101a2b] px-3.5 py-3 font-mono text-xs text-slate-200 shadow-2xl shadow-black/50 animate-in slide-in-from-right-3 fade-in duration-200`} role="status">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
      <div>
        <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-400">NOTIFICATION</div>
        <span className="leading-relaxed">{message}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="Close notification" className="ml-2 text-slate-500 hover:text-slate-200">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}