import { createContext, useContext, useState, type ReactNode } from "react";
import type { Message, FileAttachment } from "@/lib/chat-stream";
import type { AnalysisConfig } from "@/components/AnalysisSettings";
import type { CaseInfo } from "@/components/CaseInfoForm";

type Phase = "upload" | "processing" | "report";

interface AnalysisState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  files: FileAttachment[];
  setFiles: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  caseId: string | null;
  setCaseId: React.Dispatch<React.SetStateAction<string | null>>;
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  analysisConfig: AnalysisConfig;
  setAnalysisConfig: React.Dispatch<React.SetStateAction<AnalysisConfig>>;
  caseInfo: CaseInfo;
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisState | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    mode: "completa",
    detail: "standard",
    ocrAdvanced: false,
    anonymize: true,
  });
  const [caseInfo, setCaseInfo] = useState<CaseInfo>({
    titoloPratica: "",
    numeroPratica: "",
    note: "",
  });

  const reset = () => {
    setMessages([]);
    setFiles([]);
    setIsLoading(false);
    setCaseId(null);
    setPhase("upload");
    setCaseInfo({ titoloPratica: "", numeroPratica: "", note: "" });
  };

  return (
    <AnalysisContext.Provider
      value={{
        messages, setMessages, files, setFiles, isLoading, setIsLoading,
        caseId, setCaseId, phase, setPhase, analysisConfig, setAnalysisConfig,
        caseInfo, setCaseInfo, reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
