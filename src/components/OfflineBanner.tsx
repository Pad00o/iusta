import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="bg-destructive text-destructive-foreground text-sm px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-50">
      <WifiOff className="h-4 w-4" />
      Sei offline. Le analisi e i salvataggi non sono disponibili.
    </div>
  );
}
