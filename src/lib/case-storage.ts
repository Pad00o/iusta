import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/lib/chat-stream";

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
}): Promise<Case> {
  const title = generateTitle(caseData.messages);

  if (caseData.id) {
    const { data, error } = await supabase
      .from("cases")
      .update({
        title,
        messages: caseData.messages as any,
        folder: caseData.folder ?? null,
        titolo_pratica: caseData.titoloPratica ?? "",
        numero_pratica: caseData.numeroPratica ?? "",
        note: caseData.note ?? "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseData.id)
      .select()
      .single();

    if (!error && data) return toCase(data);
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      title,
      messages: caseData.messages as any,
      folder: caseData.folder ?? null,
      titolo_pratica: caseData.titoloPratica ?? "",
      numero_pratica: caseData.numeroPratica ?? "",
      note: caseData.note ?? "",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to save case");
  }
  return toCase(data);
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
