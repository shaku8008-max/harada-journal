"use client";

import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("Check your email for a sign-in link.");
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
          className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--aether-lilac)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aether-lilac)] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? "Sending link..." : "Send magic link"}
      </button>
      {message && <p className="rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
      {error && <p className="rounded-xl bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">{error}</p>}
    </form>
  );
}
