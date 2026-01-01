import { useLocation } from "wouter";
import ProSidebar from "@/components/pro/ProSidebar";
import { useProAccess } from "@/hooks/use-pro-access";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, ReactNode } from "react";

interface ProDashboardProps {
  children?: ReactNode;
}

export default function ProDashboard({ children }: ProDashboardProps) {
  const { isPro, daysRemaining } = useProAccess();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isPro) {
      navigate("/");
    }
  }, [isPro, navigate]);

  if (!isPro) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProSidebar daysRemaining={daysRemaining} />

      <div className="ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-8">
            <div>
              <h1 className="text-lg font-bold">Pro Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
