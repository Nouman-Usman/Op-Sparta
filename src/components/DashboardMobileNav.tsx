"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Settings, PlusCircle, Zap, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/overview", icon: Home },
  { name: "Studio", href: "/studio", icon: Sparkles },
  { name: "Assets", href: "/assets", icon: Images },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Zap size={16} className="fill-current" />
            </div>
            <span className="text-sm font-bold tracking-wide text-white">Sparta</span>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"
          >
            <PlusCircle size={14} />
            New
          </Link>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-4 px-1 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold",
                  isActive ? "text-accent bg-accent/10" : "text-muted-foreground"
                )}
              >
                <item.icon size={14} />
                <span className="text-[9px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
