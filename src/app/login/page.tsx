"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { DuoLogo } from "@/components/ui/DuoLogo";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
  const storeError = useAuthStore((s) => s.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please fill in both email and password.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signInWithPassword(email, password);
        if (res.success) {
          router.push("/");
        } else if (res.error) {
          setLocalError(res.error);
        }
      } else {
        const res = await signUp(email, password, username);
        if (res.success) {
          router.push("/");
        } else if (res.error) {
          setLocalError(res.error);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await signInWithOAuth("google");
      if (!res.success && res.error) {
        setLocalError(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    signInAsGuest("Guest Explorer");
    router.push("/");
  };

  const displayedError = localError || storeError;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-base)] px-4 py-12 text-white">
      {/* Return to App */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to player</span>
      </Link>

      <div className="w-full max-w-md rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-8 shadow-2xl">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <DuoLogo />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Stream millions of songs with Creative Commons licensing.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mt-6 flex rounded-lg bg-[var(--color-bg-surface)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setLocalError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
              mode === "signin"
                ? "bg-[var(--color-bg-hover)] text-white shadow"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setLocalError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-bold transition ${
              mode === "signup"
                ? "bg-[var(--color-bg-hover)] text-white shadow"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {displayedError && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-white focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-md border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-white placeholder-[var(--color-text-muted)] focus:border-white focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--color-accent)] py-2.5 text-xs font-bold text-black transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{mode === "signin" ? "Sign In" : "Sign Up"}</span>
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-[var(--color-bg-hover)]" />
          <span className="absolute bg-[var(--color-bg-elevated)] px-3 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            or
          </span>
        </div>

        {/* OAuth & Guest Options */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-bg-hover)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestDemo}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--color-bg-hover)] py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
}
