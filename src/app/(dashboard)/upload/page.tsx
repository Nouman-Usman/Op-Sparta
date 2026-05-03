import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UploadClient } from "@/components/upload/UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const [userRow] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <UploadClient
      userId={user.id}
      userTimezone={userRow?.timezone ?? null}
    />
  );
}
