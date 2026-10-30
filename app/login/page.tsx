import { LoginForm } from "./login-form";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 p-6 shadow-[0_24px_80px_rgb(0_0_0_/_0.3)] backdrop-blur-sm sm:p-10">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">H</span><p className="text-sm font-semibold tracking-tight text-[var(--ink)]">Harada Journal</p></div>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.045em]">Come back to your window.</h1>
        <p className="mt-3 text-[var(--muted-ink)]">
          Enter your email and we&apos;ll send you a one-click sign-in link.
        </p>
        {error === "callback" && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            That sign-in link is invalid or has expired. Request a new one below.
          </p>
        )}
        <LoginForm />
      </section>
    </main>
  );
}
