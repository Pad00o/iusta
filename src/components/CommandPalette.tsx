import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { MessageSquare, FolderClock, FileText, Settings, BarChart3, GitCompare } from "lucide-react";
import { getAllCases, type Case } from "@/lib/case-storage";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (open) getAllCases().then(setCases); }, [open]);

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cerca caso, comando o pagina…" />
      <CommandList>
        <CommandEmpty>Nessun risultato.</CommandEmpty>
        <CommandGroup heading="Navigazione">
          <CommandItem onSelect={() => go("/")}><MessageSquare className="mr-2 h-4 w-4" />Nuova analisi</CommandItem>
          <CommandItem onSelect={() => go("/storico")}><FolderClock className="mr-2 h-4 w-4" />Storico</CommandItem>
          <CommandItem onSelect={() => go("/modelli")}><FileText className="mr-2 h-4 w-4" />Modelli</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="mr-2 h-4 w-4" />Analytics</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" />Impostazioni</CommandItem>
        </CommandGroup>
        {cases.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Casi recenti">
              {cases.slice(0, 10).map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/?case=${c.id}`)}>
                  <GitCompare className="mr-2 h-4 w-4 text-muted-foreground" />
                  {c.titoloPratica || c.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
