import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { History, RotateCcw } from "lucide-react";
import { getCaseVersions, type CaseVersion } from "@/lib/case-storage";
import type { Message } from "@/lib/chat-stream";

export function VersionHistory({
  caseId, onRestore,
}: { caseId: string | null; onRestore: (msgs: Message[]) => void }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<CaseVersion[]>([]);

  useEffect(() => {
    if (open && caseId) getCaseVersions(caseId).then(setVersions);
  }, [open, caseId]);

  if (!caseId) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <History className="h-3.5 w-3.5" /> Versioni
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>Cronologia versioni</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-2">
          {versions.length === 0 && <p className="text-sm text-muted-foreground">Nessuna versione precedente.</p>}
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-md border border-border">
              <div>
                <p className="text-sm font-medium">{v.label || "Snapshot"}</p>
                <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString("it-IT")}</p>
                <p className="text-xs text-muted-foreground">{v.snapshot?.messages?.length ?? 0} messaggi</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { onRestore(v.snapshot.messages); setOpen(false); }}>
                <RotateCcw className="h-3 w-3 mr-1" /> Ripristina
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
