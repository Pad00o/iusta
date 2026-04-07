import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FolderPlus, Folder, FolderOpen, MoreVertical, MoveRight, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAllCases, deleteCase, getFolders, addFolder, deleteFolder, moveCaseToFolder, type Case } from "@/lib/case-storage";
import { toast } from "@/hooks/use-toast";

export default function Storico() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const reload = async () => {
    setCases(await getAllCases());
    setFolders(await getFolders());
  };

  useEffect(() => { reload(); }, []);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (activeFolder) result = result.filter((c) => c.folder === activeFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.titoloPratica?.toLowerCase().includes(q)) ||
        (c.numeroPratica?.toLowerCase().includes(q))
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((c) => new Date(c.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((c) => new Date(c.createdAt) <= to);
    }
    return result;
  }, [cases, activeFolder, searchQuery, dateFrom, dateTo]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await addFolder(name);
    setNewFolderName("");
    setShowNewFolder(false);
    reload();
  };

  const handleDeleteCase = async () => {
    if (!deleteTarget) return;
    await deleteCase(deleteTarget);
    setDeleteTarget(null);
    reload();
    toast({ title: "Caso eliminato" });
  };

  const handleDeleteFolder = async (name: string) => {
    await deleteFolder(name);
    if (activeFolder === name) setActiveFolder(null);
    reload();
  };

  const handleMoveToFolder = async (caseId: string, folder: string | undefined) => {
    await moveCaseToFolder(caseId, folder);
    reload();
  };

  const openCase = (id: string) => navigate(`/?case=${id}`);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("it-IT", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Storico Analisi</h1>
            <p className="text-sm text-muted-foreground mt-1">{cases.length} casi totali</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per titolo, pratica, numero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 text-sm"
              placeholder="Da"
            />
            <span className="text-muted-foreground text-sm">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 text-sm"
              placeholder="A"
            />
          </div>
        </div>

        {/* Folders */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Button variant={activeFolder === null ? "default" : "outline"} size="sm" onClick={() => setActiveFolder(null)}>
            Tutti ({cases.length})
          </Button>
          {folders.map((f) => (
            <div key={f} className="flex items-center gap-1">
              <Button variant={activeFolder === f ? "default" : "outline"} size="sm" onClick={() => setActiveFolder(f)}>
                {activeFolder === f ? <FolderOpen className="h-3.5 w-3.5 mr-1" /> : <Folder className="h-3.5 w-3.5 mr-1" />}
                {f} ({cases.filter((c) => c.folder === f).length})
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleDeleteFolder(f)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {showNewFolder ? (
            <div className="flex items-center gap-1">
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nome cartella" className="h-8 w-36 text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} />
              <Button size="sm" onClick={handleCreateFolder}>Crea</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>✕</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
              <FolderPlus className="h-3.5 w-3.5 mr-1" /> Nuova cartella
            </Button>
          )}
        </div>

        {/* Cases list */}
        {filteredCases.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {cases.length === 0 ? "Nessuna analisi salvata. Inizia dalla sezione Analisi." : "Nessun risultato trovato."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCases.map((c) => {
              const preview = c.messages.find((m) => m.role === "user")?.content.slice(0, 120) || "";
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => openCase(c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{c.titoloPratica || c.title}</h3>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{preview}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      {c.folder && (
                        <span className="text-xs bg-accent px-2 py-0.5 rounded">
                          <Folder className="h-3 w-3 inline mr-1" />{c.folder}
                        </span>
                      )}
                      {c.numeroPratica && <span className="text-xs text-muted-foreground">N° {c.numeroPratica}</span>}
                      <span className="text-xs text-muted-foreground">{c.messages.length} messaggi</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {folders.length > 0 && (
                        <>
                          {folders.map((f) => (
                            <DropdownMenuItem key={f} onClick={() => handleMoveToFolder(c.id, f)}>
                              <MoveRight className="h-3.5 w-3.5 mr-2" />Sposta in "{f}"
                            </DropdownMenuItem>
                          ))}
                          {c.folder && (
                            <DropdownMenuItem onClick={() => handleMoveToFolder(c.id, undefined)}>
                              <MoveRight className="h-3.5 w-3.5 mr-2" />Rimuovi dalla cartella
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare questo caso?</AlertDialogTitle>
              <AlertDialogDescription>Questa azione è irreversibile.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCase}>Elimina</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
