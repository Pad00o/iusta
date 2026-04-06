import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface CaseInfo {
  titoloPratica: string;
  numeroPratica: string;
  note: string;
}

interface CaseInfoFormProps {
  info: CaseInfo;
  onChange: (info: CaseInfo) => void;
}

export function CaseInfoForm({ info, onChange }: CaseInfoFormProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Informazioni pratica (opzionale)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Titolo pratica</Label>
          <Input
            value={info.titoloPratica}
            onChange={(e) => onChange({ ...info, titoloPratica: e.target.value })}
            placeholder="Es. Sinistro Rossi vs Bianchi"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Numero pratica</Label>
          <Input
            value={info.numeroPratica}
            onChange={(e) => onChange({ ...info, numeroPratica: e.target.value })}
            placeholder="Es. 2024/001"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Note</Label>
          <span className="text-xs text-muted-foreground">{info.note.length}/500</span>
        </div>
        <Textarea
          value={info.note}
          onChange={(e) => {
            if (e.target.value.length <= 500) onChange({ ...info, note: e.target.value });
          }}
          placeholder="Note aggiuntive sulla pratica..."
          className="min-h-[60px] text-sm resize-none"
        />
      </div>
    </div>
  );
}
