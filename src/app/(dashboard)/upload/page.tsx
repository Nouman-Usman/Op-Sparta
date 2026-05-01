import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UploadClient } from "@/components/upload/UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  return <UploadClient userId={user.id} />;
}
