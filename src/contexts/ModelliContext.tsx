import { createContext, useContext, useState, type ReactNode } from "react";
import type { LegalTemplate } from "@/lib/templates";

interface ModelliState {
  selectedTemplate: LegalTemplate | null;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<LegalTemplate | null>>;
  selectedCaseId: string;
  setSelectedCaseId: React.Dispatch<React.SetStateAction<string>>;
  generatedDoc: string;
  setGeneratedDoc: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  resetModelli: () => void;
}

const ModelliContext = createContext<ModelliState | null>(null);

export function ModelliProvider({ children }: { children: ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const resetModelli = () => {
    setSelectedTemplate(null);
    setSelectedCaseId("");
    setGeneratedDoc("");
    setIsGenerating(false);
  };

  return (
    <ModelliContext.Provider
      value={{
        selectedTemplate, setSelectedTemplate,
        selectedCaseId, setSelectedCaseId,
        generatedDoc, setGeneratedDoc,
        isGenerating, setIsGenerating,
        resetModelli,
      }}
    >
      {children}
    </ModelliContext.Provider>
  );
}

export function useModelli() {
  const ctx = useContext(ModelliContext);
  if (!ctx) throw new Error("useModelli must be used within ModelliProvider");
  return ctx;
}
