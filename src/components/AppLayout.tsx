import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { ModelliProvider } from "@/contexts/ModelliContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { CommandPalette } from "@/components/CommandPalette";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <AnalysisProvider>
      <ModelliProvider>
        <SidebarProvider>
          <OfflineBanner />
          <OnboardingTour />
          <CommandPalette />
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-12 flex items-center border-b border-border px-2 flex-shrink-0 bg-card">
                <SidebarTrigger className="ml-1" />
                <span className="ml-auto mr-3 text-[10px] text-muted-foreground hidden sm:inline">
                  ⌘K per cercare
                </span>
              </header>
              <main className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ModelliProvider>
    </AnalysisProvider>
  );
}
