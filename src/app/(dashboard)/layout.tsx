import { Sidebar } from "@/components/Sidebar";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardMobileNav />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
        </main>
      </div>
    </div>
  );
}
