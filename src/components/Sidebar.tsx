"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  PlusCircle,
  Zap,
  LogOut,
  Loader2,
  Upload,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/overview", icon: LayoutDashboard },
  { name: "Content Studio", href: "/studio", icon: Sparkles },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Planner", href: "/planner", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="hidden h-screen w-64 sticky top-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(var(--accent),0.3)]">
          <Zap className="text-accent-foreground fill-accent-foreground" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight bg-linear-to-br from-white to-zinc-500 bg-clip-text text-transparent">
          Sparta
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="pb-4 pt-2">
          <Link href="/projects/new" className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-accent/20 active:scale-[0.98]">
            <PlusCircle size={18} />
            New Project
          </Link>
        </div>

        <div className="py-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? (
            <Loader2 size={18} className="animate-spin text-red-400" />
          ) : (
            <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
          )}
          <span className="font-medium text-sm">{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );
}
