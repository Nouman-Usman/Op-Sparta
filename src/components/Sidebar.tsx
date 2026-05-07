"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Images,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/overview", icon: LayoutDashboard },
  { name: "Content Studio", href: "/studio", icon: Sparkles },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Assets", href: "/assets", icon: Images },
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden h-screen sticky top-0 border-r border-border bg-card md:flex md:flex-col shrink-0 z-50 relative"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md hover:bg-accent/90 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("p-6 flex items-center gap-3", isCollapsed ? "justify-center px-0" : "")}>
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(var(--accent),0.3)]">
          <Zap className="text-accent-foreground fill-accent-foreground" size={24} />
        </div>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xl font-bold tracking-tight bg-linear-to-br from-white to-zinc-500 bg-clip-text text-transparent whitespace-nowrap"
            >
              Sparta
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="pb-4 pt-2">
          <Link href="/projects/new" prefetch={true} className={cn("w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-accent/20 active:scale-[0.98]", isCollapsed && "px-0")}>
            <PlusCircle size={18} className="shrink-0" />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  New Project
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="py-2 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "relative flex items-center gap-3 py-2.5 rounded-lg transition-colors group",
                  isActive 
                    ? "text-accent" 
                    : "text-muted-foreground hover:text-foreground",
                  isCollapsed ? "justify-center px-0" : "px-3"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-tab"
                    className="absolute inset-0 bg-accent/10 rounded-lg border border-accent/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={cn(
                  "relative z-10 shrink-0 transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border mt-auto bg-card z-10">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "relative flex items-center gap-3 py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "text-accent" 
                  : "text-muted-foreground hover:text-foreground",
                isCollapsed ? "justify-center px-0" : "px-3"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-tab"
                  className="absolute inset-0 bg-accent/10 rounded-lg border border-accent/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={20} className="relative z-10 shrink-0" />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={isCollapsed ? "Sign Out" : undefined}
          className={cn(
            "mt-3 relative w-full flex items-center gap-3 py-2.5 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed",
            isCollapsed ? "justify-center px-0" : "px-3"
          )}
        >
          {loggingOut ? (
            <Loader2 size={18} className="relative z-10 shrink-0 animate-spin text-red-400" />
          ) : (
            <LogOut size={18} className="relative z-10 shrink-0 group-hover:text-red-400 transition-colors" />
          )}
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="relative z-10 font-medium text-sm whitespace-nowrap overflow-hidden"
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}
