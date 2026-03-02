import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isAuthed, login } from "../auth/auth";

type LocationState = { from?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const redirectTo = useMemo(() => state.from || "/explore", [state.from]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed()) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return setError("Please enter your email.");
    if (!trimmed.includes("@")) return setError("Please enter a valid email.");

    
    login(trimmed);
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100">Swim Live</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to continue</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-white transition"
          >
            Sign In
          </button>

          <p className="text-xs text-slate-500">
            MVP login uses localStorage. We can connect it to backend auth later.
          </p>
        </form>
      </div>
    </div>
  );
}