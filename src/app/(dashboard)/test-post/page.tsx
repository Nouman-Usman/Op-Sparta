import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TestPostClient from "@/components/test-post/TestPostClient";
import { Zap } from "lucide-react";

export default async function TestPostPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-accent" size={16} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Global System Check</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Test Publisher
        </h1>
        <p className="text-zinc-400 mt-2 max-w-2xl">
          Validate the Instagram Graph API connection. This will force a test payload directly to the authenticated Instagram account.
        </p>
      </div>

      <TestPostClient />
    </div>
  );
}
