import { useCallback, useRef } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
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

export function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: FileAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) continue;
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
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-sm text-muted-foreground">
          Trascina qui i file o <span className="text-primary font-medium">clicca per caricare</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — max 20MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-accent rounded-md px-3 py-1.5 text-sm">
              {file.type === "application/pdf" ? (
                <FileText className="h-4 w-4 text-primary" />
              ) : (
                <Image className="h-4 w-4 text-primary" />
              )}
              <span className="max-w-[150px] truncate">{file.name}</span>
              <span className="text-muted-foreground text-xs">{formatSize(file.size)}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
