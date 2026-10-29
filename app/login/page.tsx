import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4 py-10 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">
          Harada Journal
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Come back to your window.</h1>
        <p className="mt-3 text-[var(--muted-ink)]">
          Enter your email and we&apos;ll send you a one-click sign-in link.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
