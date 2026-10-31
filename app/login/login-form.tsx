"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function friendlyAuthError(authError: { message?: string; status?: number }, kind: "password" | "magic-link") {
    const text = authError.message?.toLowerCase() ?? "";

    if (authError.status === 429 || text.includes("rate limit") || text.includes("too many")) {
      return kind === "magic-link"
        ? "Too many requests. Try again in a few minutes."
        : "Too many attempts. Try again in a few minutes.";
    }
    if (kind === "password" && (text.includes("invalid login credentials") || text.includes("invalid credentials"))) {
      return "Email or password is incorrect.";
    }
    if (kind === "magic-link" && (text.includes("signups not allowed") || text.includes("user not found") || text.includes("not registered"))) {
      return "This email isn't registered. Ask for an invite.";
    }
    return "Something went wrong. Please try again.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      if (mode === "password") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(friendlyAuthError(signInError, "password"));
        } else {
          router.replace("/");
          router.refresh();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: false,
          },
        });
        if (signInError) {
          setError(friendlyAuthError(signInError, "magic-link"));
        } else {
          setMessage("Check your email for a sign-in link.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
        />
      </div>
      {mode === "password" && (
        <div>
          <label htmlFor="password" className="text-sm font-medium text-[var(--ink)]">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 pr-20 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 min-h-11 px-4 text-sm font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 w-full rounded-full bg-[var(--accent)] px-5 py-3 text-[15px] font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--aether-lilac)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aether-lilac)] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? (mode === "password" ? "Signing in..." : "Sending link...") : (mode === "password" ? "Sign in" : "Send magic link")}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode((currentMode) => currentMode === "password" ? "magic-link" : "password");
          setMessage(null);
          setError(null);
        }}
        className="min-h-11 w-full rounded-full border border-[var(--line)] px-5 py-3 text-[15px] font-medium text-[var(--ink)] transition hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {mode === "password" ? "Email me a link instead" : "Use password instead"}
      </button>
      {message && <p className="rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
      {error && <p className="rounded-xl bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">{error}</p>}
    </form>
  );
}
