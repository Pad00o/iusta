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

const CASES_KEY = "legalagent_cases";
const FOLDERS_KEY = "legalagent_folders";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Nuovo caso";
  const text = firstUser.content.replace(/\[File allegati:.*?\]/g, "").trim();
  return text.slice(0, 60) || "Nuovo caso";
}

export function getAllCases(): Case[] {
  try {
    return JSON.parse(localStorage.getItem(CASES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCase(id: string): Case | undefined {
  return getAllCases().find((c) => c.id === id);
}

export function saveCase(caseData: { id?: string; messages: Message[]; folder?: string }): Case {
  const cases = getAllCases();
  const now = new Date().toISOString();

  if (caseData.id) {
    const idx = cases.findIndex((c) => c.id === caseData.id);
    if (idx !== -1) {
      cases[idx] = {
        ...cases[idx],
        messages: caseData.messages,
        title: generateTitle(caseData.messages),
        updatedAt: now,
        folder: caseData.folder ?? cases[idx].folder,
      };
      localStorage.setItem(CASES_KEY, JSON.stringify(cases));
      return cases[idx];
    }
  }

  const newCase: Case = {
    id: caseData.id || generateId(),
    title: generateTitle(caseData.messages),
    messages: caseData.messages,
    createdAt: now,
    updatedAt: now,
    folder: caseData.folder,
  };
  cases.unshift(newCase);
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  return newCase;
}

export function deleteCase(id: string): void {
  const cases = getAllCases().filter((c) => c.id !== id);
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export function moveCaseToFolder(id: string, folder: string | undefined): void {
  const cases = getAllCases();
  const c = cases.find((c) => c.id === id);
  if (c) {
    c.folder = folder;
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  }
}

export function getFolders(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addFolder(name: string): void {
  const folders = getFolders();
  if (!folders.includes(name)) {
    folders.push(name);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }
}

export function deleteFolder(name: string): void {
  const folders = getFolders().filter((f) => f !== name);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  // Move cases from deleted folder to no folder
  const cases = getAllCases();
  cases.forEach((c) => {
    if (c.folder === name) c.folder = undefined;
  });
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}
