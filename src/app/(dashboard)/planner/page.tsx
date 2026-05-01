import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PlannerClient } from "@/components/planner/PlannerClient";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  return <PlannerClient />;
}
