import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/lib/chat-stream";

export type CaseStatus = "bozza" | "completato" | "archiviato";

export interface UploadedFileRef {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface Case {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  folder?: string;
  titoloPratica?: string;
  numeroPratica?: string;
  note?: string;
  uploadedFiles?: UploadedFileRef[];
  reportSummary?: string;
  status?: CaseStatus;
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Nuovo caso";
  const text = firstUser.content.replace(/\[File allegati:.*?\]/g, "").trim();
  return text.slice(0, 60) || "Nuovo caso";
}

function toCase(row: any): Case {
  return {
    id: row.id,
    title: row.title,
    messages: (row.messages as Message[]) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    folder: row.folder ?? undefined,
    titoloPratica: row.titolo_pratica ?? undefined,
    numeroPratica: row.numero_pratica ?? undefined,
    note: row.note ?? undefined,
    uploadedFiles: (row.uploaded_files as UploadedFileRef[]) || [],
    reportSummary: row.report_summary ?? undefined,
    status: (row.status as CaseStatus) ?? "bozza",
  };
}

export async function getAllCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(toCase);
}

export async function getCase(id: string): Promise<Case | undefined> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return toCase(data);
}

export async function saveCase(caseData: {
  id?: string;
  messages: Message[];
  folder?: string;
  titoloPratica?: string;
  numeroPratica?: string;
  note?: string;
  uploadedFiles?: UploadedFileRef[];
  status?: CaseStatus;
  reportSummary?: string;
}): Promise<Case> {
  const title = generateTitle(caseData.messages);

  const payload: any = {
    title,
    messages: caseData.messages as any,
    folder: caseData.folder ?? null,
    titolo_pratica: caseData.titoloPratica ?? "",
    numero_pratica: caseData.numeroPratica ?? "",
    note: caseData.note ?? "",
  };
  if (caseData.uploadedFiles !== undefined) payload.uploaded_files = caseData.uploadedFiles as any;
  if (caseData.status !== undefined) payload.status = caseData.status;
  if (caseData.reportSummary !== undefined) payload.report_summary = caseData.reportSummary;

  if (caseData.id) {
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("cases")
      .update(payload)
      .eq("id", caseData.id)
      .select()
      .single();
    if (!error && data) return toCase(data);
  }

  const { data, error } = await supabase
    .from("cases")
    .insert(payload)
    .select()
    .single();

  if (error) { console.error(error); throw new Error("Failed to save case"); }
  return toCase(data);
}

export async function updateCaseStatus(id: string, status: CaseStatus): Promise<void> {
  await supabase.from("cases").update({ status }).eq("id", id);
}

export async function updateCaseSummary(id: string, summary: string): Promise<void> {
  await supabase.from("cases").update({ report_summary: summary }).eq("id", id);
}

export async function deleteCase(id: string): Promise<void> {
  await supabase.from("cases").delete().eq("id", id);
}

export async function moveCaseToFolder(id: string, folder: string | undefined): Promise<void> {
  await supabase.from("cases").update({ folder: folder ?? null }).eq("id", id);
}

export async function getFolders(): Promise<string[]> {
  const { data } = await supabase
    .from("folders")
    .select("name")
    .order("created_at", { ascending: true });
  return (data || []).map((f: any) => f.name);
}

export async function addFolder(name: string): Promise<void> {
  await supabase.from("folders").insert({ name });
}

export async function deleteFolder(name: string): Promise<void> {
  await supabase.from("folders").delete().eq("name", name);
  await supabase.from("cases").update({ folder: null }).eq("folder", name);
}

// Versions
export interface CaseVersion {
  id: string;
  caseId: string;
  snapshot: { messages: Message[] };
  label?: string;
  createdAt: string;
}

export async function saveCaseVersion(caseId: string, messages: Message[], label?: string): Promise<void> {
  await supabase.from("case_versions").insert({
    case_id: caseId,
    snapshot: { messages } as any,
    label: label ?? null,
  });
}

export async function getCaseVersions(caseId: string): Promise<CaseVersion[]> {
  const { data } = await supabase
    .from("case_versions")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  return (data || []).map((r: any) => ({
    id: r.id,
    caseId: r.case_id,
    snapshot: r.snapshot,
    label: r.label ?? undefined,
    createdAt: r.created_at,
  }));
}

// File upload helpers
export async function uploadCaseFile(caseId: string, file: File): Promise<UploadedFileRef> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${caseId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("case-files").upload(path, file, { upsert: false });
  if (error) throw error;
  return { name: file.name, path, size: file.size, type: file.type };
}

export function getCaseFileUrl(path: string): string {
  return supabase.storage.from("case-files").getPublicUrl(path).data.publicUrl;
}
