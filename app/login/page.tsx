import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 text-stone-950">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Harada Journal
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Come back to your window.</h1>
        <p className="mt-3 text-stone-600">
          Enter your email and we&apos;ll send you a one-click sign-in link.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
