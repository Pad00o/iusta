import { useCallback, useRef } from "react";
import { Upload, X, FileText, Image, CheckCircle, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileAttachment } from "@/lib/chat-stream";

interface FileUploadZoneProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VALID_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function fileIcon(type: string) {
  if (type === "application/pdf") return <FileText className="h-4 w-4 text-primary flex-shrink-0" />;
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-primary flex-shrink-0" />;
  return <File className="h-4 w-4 text-primary flex-shrink-0" />;
}

export function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: FileAttachment[] = [];
      for (const file of Array.from(fileList)) {
        if (!VALID_TYPES.includes(file.type)) continue;
        if (file.size > 20 * 1024 * 1024) continue;

        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });

        newFiles.push({ name: file.name, type: file.type, size: file.size, data });
      }
      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Trascina qui i file o <span className="text-primary">seleziona file</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOCX — max 20MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            File caricati ({files.length})
          </h3>
          <div className="space-y-1.5">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {fileIcon(file.type)}
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatSize(file.size)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
