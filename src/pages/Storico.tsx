import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FolderPlus, Folder, FolderOpen, MoreVertical, MoveRight, Search, CalendarDays, Archive, GitCompare, Download, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAllCases, deleteCase, getFolders, addFolder, deleteFolder, moveCaseToFolder,
  updateCaseStatus, type Case, type CaseStatus,
} from "@/lib/case-storage";
import { toast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<CaseStatus, string> = { bozza: "Bozza", completato: "Completato", archiviato: "Archiviato" };
const STATUS_COLOR: Record<CaseStatus, string> = {
  bozza: "bg-amber-100 text-amber-700",
  completato: "bg-emerald-100 text-emerald-700",
  archiviato: "bg-gray-200 text-gray-600",
};

export default function Storico() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "tutti">("tutti");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const reload = async () => {
    setCases(await getAllCases());
    setFolders(await getFolders());
  };
  useEffect(() => { reload(); }, []);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (activeFolder) result = result.filter((c) => c.folder === activeFolder);
    if (statusFilter !== "tutti") result = result.filter((c) => (c.status || "bozza") === statusFilter);
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
  }, [cases, activeFolder, statusFilter, searchQuery, dateFrom, dateTo]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await addFolder(name); setNewFolderName(""); setShowNewFolder(false); reload();
  };

  const handleDeleteCase = async () => {
    if (!deleteTarget) return;
    await deleteCase(deleteTarget); setDeleteTarget(null); reload();
    toast({ title: "Caso eliminato" });
  };

  const handleArchive = async (id: string) => {
    await updateCaseStatus(id, "archiviato");
    reload();
    toast({ title: "Caso archiviato" });
  };

  const handleCompare = () => {
    if (selectedIds.size < 2) {
      toast({ title: "Seleziona almeno 2 casi" }); return;
    }
    navigate(`/confronta?ids=${[...selectedIds].slice(0, 2).join(",")}`);
  };

  const handleExportZip = async () => {
    if (selectedIds.size === 0) { toast({ title: "Seleziona almeno 1 caso" }); return; }
    setExporting(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-cases-zip`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ caseIds: [...selectedIds] }),
        }
      );
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `iusta_export_${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Esportati ${selectedIds.size} casi` });
    } catch {
      toast({ title: "Errore export ZIP", variant: "destructive" });
    } finally { setExporting(false); }
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
          <div className="flex items-center gap-2">
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {selectMode ? `Selezionati (${selectedIds.size})` : "Selezione multipla"}
            </Button>
            {selectMode && selectedIds.size > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={handleCompare} disabled={selectedIds.size < 2}>
                  <GitCompare className="h-4 w-4 mr-1" /> Confronta
                </Button>
                <Button size="sm" onClick={handleExportZip} disabled={exporting}>
                  <Download className="h-4 w-4 mr-1" /> Esporta ZIP
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cerca…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 text-sm" />
            <span className="text-muted-foreground text-sm">—</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 text-sm" />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["tutti", "bozza", "completato", "archiviato"] as const).map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "tutti" ? "Tutti gli stati" : STATUS_LABEL[s]}
            </Button>
          ))}
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
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => deleteFolder(f).then(reload)}>
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
            {cases.length === 0 ? "Nessuna analisi salvata." : "Nessun risultato."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCases.map((c) => {
              const status = c.status || "bozza";
              const summary = c.reportSummary;
              const selected = selectedIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${selected ? "border-primary bg-primary/5" : "border-border bg-card"} hover:bg-accent/50 transition-colors cursor-pointer group`}
                  onClick={() => selectMode ? toggleSelect(c.id) : openCase(c.id)}
                >
                  {selectMode && (
                    <Checkbox checked={selected} onCheckedChange={() => toggleSelect(c.id)} onClick={(e) => e.stopPropagation()} className="mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">{c.titoloPratica || c.title}</h3>
                      <Badge className={`${STATUS_COLOR[status]} text-[10px] px-1.5 py-0`} variant="outline">
                        {STATUS_LABEL[status]}
                      </Badge>
                    </div>
                    {summary ? (
                      <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{summary}</div>
                    ) : (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {c.messages.find((m) => m.role === "user")?.content.slice(0, 120) || ""}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      {c.folder && (
                        <span className="text-xs bg-accent px-2 py-0.5 rounded">
                          <Folder className="h-3 w-3 inline mr-1" />{c.folder}
                        </span>
                      )}
                      {c.numeroPratica && <span className="text-xs text-muted-foreground">N° {c.numeroPratica}</span>}
                      {(c.uploadedFiles?.length ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">📎 {c.uploadedFiles!.length} file</span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {status !== "archiviato" && (
                        <DropdownMenuItem onClick={() => handleArchive(c.id)}>
                          <Archive className="h-3.5 w-3.5 mr-2" />Archivia
                        </DropdownMenuItem>
                      )}
                      {folders.length > 0 && (
                        <>
                          {folders.map((f) => (
                            <DropdownMenuItem key={f} onClick={() => moveCaseToFolder(c.id, f).then(reload)}>
                              <MoveRight className="h-3.5 w-3.5 mr-2" />Sposta in "{f}"
                            </DropdownMenuItem>
                          ))}
                          {c.folder && (
                            <DropdownMenuItem onClick={() => moveCaseToFolder(c.id, undefined).then(reload)}>
                              <MoveRight className="h-3.5 w-3.5 mr-2" />Rimuovi cartella
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
