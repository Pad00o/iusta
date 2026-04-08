

## Piano: Aggiornamento Prompt IUSTA V2 + Export DOCX + Markdown Viewer migliorato

### 1. Aggiornamento System Prompt (Edge Function `chat`)

Sostituire il `SYSTEM_PROMPT` in `supabase/functions/chat/index.ts` con il nuovo prompt IUSTA V2 fornito. Il prompt include:
- Protocollo RAG a 3 step (Estrazione con fonti, Cross-check contraddizioni, Violazioni CdS)
- Formato output strutturato: Cronistoria Certificata, Criticita e Contraddizioni (con icone ⚠️ ⚖️ 🛠️), Valutazione Responsabilita, Bozza Svolgimento del Fatto
- Branding "IUSTA" al posto di "LegalAgent"

Il nome dell'app nell'header del report e nel prompt viene aggiornato a "IUSTA".

### 2. Export DOCX

Creare una edge function `generate-docx` che:
- Riceve il markdown del report
- Usa la libreria `docx` (disponibile via CDN esm.sh) per generare un .docx professionale
- Converte le sezioni markdown in heading, tabelle, paragrafi formattati
- Restituisce il buffer binario come download

Nel frontend (`ReportView.tsx` e `Index.tsx`):
- Aggiungere bottone "Scarica DOCX" accanto a "Scarica PDF"
- Implementare `handleExportDocx` che chiama la nuova edge function

### 3. Markdown Viewer migliorato nel ReportView

Aggiornare `ReportView.tsx` con:
- Sezioni del report allineate al nuovo formato IUSTA V2 (Cronistoria Certificata, Criticita e Contraddizioni con highlights colorati, Valutazione Responsabilita, Bozza Svolgimento)
- Aggiornare `sectionAnchors` per riflettere le nuove sezioni
- Aggiornare il matching delle h3 per i nuovi titoli
- Rendering migliorato per i blocchi di "highlights" (⚠️ BUGIA TECNICA, ⚖️ SMENTITA, 🛠️ INCONGRUENZA) con card colorate dedicate
- Aggiungere rendering custom per le `li` (list items) con icone colorate quando contengono emoji specifiche
- Stile blockquote migliorato per la bozza dello svolgimento del fatto (sfondo verde/emerald per indicare testo pronto per l'atto)

### 4. Branding "IUSTA"

- Aggiornare header del report da "LegalAgent" a "IUSTA"
- Badge "REPORT DI ANALISI TECNICO-GIURIDICA"
- Aggiornare anche `generate-pdf/index.ts` con il nuovo branding

### File coinvolti
- **Modificati**: `supabase/functions/chat/index.ts` (nuovo prompt), `supabase/functions/generate-pdf/index.ts` (branding), `src/components/ReportView.tsx` (sezioni, DOCX button, markdown viewer), `src/pages/Index.tsx` (handler DOCX)
- **Nuovo**: `supabase/functions/generate-docx/index.ts`

