"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (email: string) => void;
}

interface StoredAccount {
  email: string;
  password: string;
  name: string;
}

const ACCOUNTS_KEY = "quant-terminal-accounts";

function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]") as StoredAccount[];
  } catch {
    return [];
  }
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredEmail = email.trim();
    const normalizedEmail = enteredEmail.toLowerCase();
    const accounts = readAccounts();
    setError("");

    if (!enteredEmail || !password) {
      setError("Enter both your email and password.");
      return;
    }
    if (enteredEmail !== normalizedEmail || !/^[a-z0-9][a-z0-9._%+-]*@gmail\.com$/.test(enteredEmail)) {
      setError("Use a lowercase Gmail address ending with @gmail.com.");
      return;
    }
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (mode === "create") {
      if (!name.trim()) {
        setError("Enter your name to create an account.");
        return;
      }
      if (accounts.some((account) => account.email === normalizedEmail)) {
        setError("An account with this email already exists.");
        return;
      }
      localStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify([...accounts, { name: name.trim(), email: normalizedEmail, password }])
      );
      onAuthenticated(normalizedEmail);
      return;
    }

    const account = accounts.find(
      (storedAccount) => storedAccount.email === normalizedEmail && storedAccount.password === password
    );
    if (!account) {
      setError("Email or password is incorrect.");
      return;
    }
    onAuthenticated(account.email);
  };

  return (
    <main className="min-h-screen bg-[#080b11] px-4 py-8 text-slate-100 selection:bg-cyan-500 selection:text-black sm:py-14">
      <div className="mx-auto grid min-h-[620px] max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b101b] shadow-2xl shadow-black/40 md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-800 bg-[#0e1725] p-10 md:flex md:flex-col md:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-500/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-emerald-500/10" />
          <div className="relative">
            <div className="mb-8 flex items-center gap-3 font-mono">
              <div className="rounded border border-cyan-700/70 bg-cyan-950/60 p-2 text-cyan-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold tracking-[0.2em] text-slate-200">QUANT_TERMINAL</span>
            </div>
            <p className="mb-3 font-mono text-xs font-bold tracking-[0.25em] text-cyan-400">RESEARCH WORKSPACE</p>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-slate-100">
              Read the market with better context.
            </h1>
            <p className="mt-5 max-w-md font-mono text-sm leading-7 text-slate-400">
              Your quantitative dashboard for real OHLCV data, risk metrics, causal backtests, and AI-assisted research.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-500">
            <span className="border-l border-cyan-500/50 pl-2">REAL DATA</span>
            <span className="border-l border-emerald-500/50 pl-2">CAUSAL SIGNALS</span>
            <span className="border-l border-amber-500/50 pl-2">AI RESEARCH</span>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-8">
              <p className="mb-2 font-mono text-xs font-bold tracking-[0.2em] text-cyan-400">
                {mode === "signin" ? "WELCOME BACK" : "NEW RESEARCH ACCOUNT"}
              </p>
              <h2 className="text-2xl font-semibold text-slate-100">
                {mode === "signin" ? "Sign in to your terminal" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{mode === "signin" ? "Continue your market analysis." : "Set up a private local workspace."}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 border-b border-slate-800 font-mono text-xs">
              <button type="button" onClick={() => { setMode("signin"); setError(""); }} className={`border-b-2 pb-3 text-left ${mode === "signin" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500"}`}>
                SIGN IN
              </button>
              <button type="button" onClick={() => { setMode("create"); setError(""); }} className={`border-b-2 pb-3 text-right ${mode === "create" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500"}`}>
                CREATE ACCOUNT
              </button>
            </div>

            <form onSubmit={submit} noValidate className="space-y-4">
              {mode === "create" && (
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[11px] text-slate-400">NAME</span>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                    <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" className="w-full rounded border border-slate-700 bg-[#080b11] py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500" />
                  </div>
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] text-slate-400">EMAIL</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" className="w-full rounded border border-slate-700 bg-[#080b11] py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[11px] text-slate-400">PASSWORD</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                  <input type={isPasswordVisible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" className="w-full rounded border border-slate-700 bg-[#080b11] py-2.5 pl-10 pr-10 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500" />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    title={isPasswordVisible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-2.5 text-slate-600 transition-colors hover:text-cyan-300"
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              {error && <p role="alert" className="rounded border border-rose-900/70 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded border border-cyan-600 bg-cyan-950/70 py-3 font-mono text-xs font-bold tracking-wide text-cyan-300 transition-colors hover:border-cyan-400 hover:text-cyan-100">
                {mode === "signin" ? "ENTER TERMINAL" : "CREATE ACCOUNT"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-6 text-center font-mono text-[10px] leading-relaxed text-slate-600">LOCAL DEMO AUTHENTICATION // USE A REAL AUTH SERVICE BEFORE PRODUCTION</p>
          </div>
        </section>
      </div>
    </main>
  );
}