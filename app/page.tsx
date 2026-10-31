import { redirect } from "next/navigation";

import { requireUser } from "@/lib/supabase/require-user";

export const instant = false;

export default async function Home({ searchParams }: { searchParams: Promise<{ window?: string | string[] | undefined }> }) {
  await requireUser();
  const query = await searchParams;
  const rawWindow = Array.isArray(query.window) ? query.window[0] : query.window;
  redirect(rawWindow === "30d" || rawWindow === "all" ? `/chart?window=${rawWindow}` : "/chart");
}
