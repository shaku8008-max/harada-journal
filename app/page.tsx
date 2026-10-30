import { redirect } from "next/navigation";

import { requireUser } from "@/lib/supabase/require-user";

export const instant = false;

export default async function Home() {
  await requireUser();
  redirect("/chart");
}
