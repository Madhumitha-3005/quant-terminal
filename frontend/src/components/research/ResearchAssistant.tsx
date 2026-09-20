"use client";

import { FormEvent, useState } from "react";
import { BrainCircuit, Loader2, Send, UserRound } from "lucide-react";
import { askResearchAssistant } from "../../lib/api";
import { ToastTone } from "../feedback/Toast";

interface ResearchAssistantProps {
  symbol: string;
  backtestResults: Record<string, unknown>;
  onNotify?: (message: string, tone: ToastTone) => void;
}

export default function ResearchAssistant({ symbol, backtestResults, onNotify }: ResearchAssistantProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await askResearchAssistant(trimmedQuestion, symbol, backtestResults);
      setAnswer(response.answer);
      setQuestion("");
      onNotify?.("AI research answer ready.", "success");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to reach research assistant";
      setError(message);
      onNotify?.(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-4 rounded-lg border border-cyan-900/70 bg-[#0b101b] p-4 font-mono shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded border border-cyan-700/70 bg-cyan-950/60 p-2 text-cyan-300">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-cyan-300">AI RESEARCH ASSISTANT</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Ask about the current {symbol} analysis</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-600">FEATHERLESS // CONTEXT-AWARE</span>
      </div>

      {answer && (
        <div className="mb-3 flex gap-2 border-l-2 border-cyan-500 bg-[#0e1626] p-3 text-xs leading-relaxed text-slate-300">
          <BrainCircuit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {error && <p className="mb-3 text-xs text-rose-400">{error}</p>}

      <form onSubmit={submitQuestion} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <UserRound className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is driving the risk profile?"
            maxLength={2000}
            className="w-full rounded border border-slate-700 bg-[#080b11] py-2.5 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="flex items-center justify-center gap-1.5 rounded border border-cyan-700 bg-cyan-950/70 px-4 py-2.5 text-xs font-bold text-cyan-300 transition-colors hover:border-cyan-400 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          ASK ASSISTANT
        </button>
      </form>
    </section>
  );
}