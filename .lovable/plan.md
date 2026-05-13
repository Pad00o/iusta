
# Piano: Refactoring "Luxury Legal Tech" IUSTA

## 1. Estetica & Branding

**Tipografia**
- Aggiungere Google Fonts in `index.html`: `Playfair Display` (titoli) + `Inter` (corpo)
- `tailwind.config.ts`: estendere `fontFamily` con `serif: ["Playfair Display", ...]` e `sans: ["Inter", ...]`
- `index.css`: applicare `font-serif` automaticamente a `h1, h2, h3` via `@layer base`

**Palette (HSL semantici in `index.css`)**
- `--background: 224 60% 7%` (Navy ultra-dark #0A0F1E)
- `--foreground: 40 30% 92%` (avorio caldo)
- `--card: 224 50% 10%` con `--card-glass` per glassmorphism
- `--primary: 43 65% 53%` (Oro #D4AF37) — solo CTA/accenti
- `--border: 40 30% 92% / 0.08` (bordi semi-trasparenti)
- Tema dark di default (forzato); rimuovere/disabilitare toggle light per la dashboard principale

**Spaziatura**
- `tailwind.config.ts`: estendere `spacing` scale +20% sui valori chiave
- Sostituire `gap-4/p-4` → `gap-6/p-6` nei container principali

## 2. Bento Grid Dashboard

- Nuovo componente `src/components/BentoGrid.tsx` + `BentoCard.tsx`
- Refactor `src/pages/Index.tsx`: layout principale a griglia bento (4 colonne, righe variabili)
  - Card grande: Upload/Nuova analisi
  - Card: Casi recenti
  - Card: Statistiche rapide (analisi totali, ore risparmiate)
  - Card: Modelli salvati
  - Card: Quick actions / templates
- Stile card: `rounded-3xl` (24px), `border border-white/8`, `bg-white/[0.03] backdrop-blur-xl`, `shadow-[0_8px_40px_rgba(0,0,0,0.4)]`
- Hover: leggero glow oro + lift `translate-y-[-2px]`

## 3. Checklist di caricamento dinamica

- Nuovo `src/components/AnalysisChecklist.tsx` che sostituisce `NeonProgressBar` durante l'analisi
- 4 step con stato `pending | running | done`:
  1. Estrazione testo da PDF e OCR
  2. Calcolo velocità cinematica e dinamica
  3. Verifica coerenza testimoniale e cross-check
  4. Generazione report finale e bozza legale
- Icone: `Loader2` (spin) durante `running`, `Check` oro per `done`, `Circle` muted per `pending`
- Animazione fade-in per ogni step + linea di connessione tra step
- Avanzamento basato su tempo simulato + eventi reali dello stream (token chunks)
- Integrare in `src/pages/Index.tsx` e `src/components/ReportView.tsx`

## 4. Report Interattivo

**Highlight contraddizioni**
- Parser markdown nel `ReportView.tsx`: rilevare blocchi marcati `⚠️ BUGIA TECNICA`, `⚖️ SMENTITA TESTIMONIALE`, o pattern `**Contraddizione:**`
- Wrappare in `<ContradictionMark>` con sfondo `bg-red-500/10`, bordo `border-red-400/30`, testo leggibile
- Click → apre `ContradictionModal.tsx` (Dialog shadcn) che mostra:
  - Titolo contraddizione
  - "Ritaglio" del documento originale (estratto del testo dalla fonte) in card stile carta
  - Spiegazione tecnica
- Fonte estratta dai messages caricati (campo `uploaded_files` su `cases`)

**Smart Drafting Sidebar**
- Nuovo `src/components/SmartDraftingSidebar.tsx` (colonna destra sticky, larghezza ~340px)
- Suggerimenti generati al termine dell'analisi via edge function `draft-suggestions` (Lovable AI Gemini Flash) che riceve il report e ritorna 5-8 suggerimenti per atto di citazione (oggetto, parti, fatto, diritto, conclusioni, richiesta danni)
- Ogni suggerimento: card con icona oro, titolo, snippet, pulsante "Copia"
- Toggle per nascondere/mostrare la sidebar; scroll sincronizzato col report

## 5. "Genera Fascicolo Pro"

- Pulsante primario oro in `ReportView.tsx` (in alto, vicino a Scarica)
- Nuova edge function `generate-fascicolo` che:
  - Genera PDF report (riusa logica `generate-pdf` migliorata, vedi §6)
  - Genera DOCX professionale (vedi §6)
  - Recupera file caricati da bucket `case-files` ed evidenzia (con marker testuali) le parti citate
  - Crea ZIP con `jszip`: `Report.pdf`, `Bozza_Atto.docx`, `Documenti_Originali/*`, `Indice.txt`
  - Ritorna ZIP scaricabile
- UI: dialog di progresso con checklist (Generazione PDF → DOCX → Pacchetto ZIP)

## 6. Fix CRITICO export documenti leggibili

**Problema attuale**: PDF/DOCX/Google Docs producono HTML grezzo con tag `<h3>`, `<br/>`, `|` di tabelle markdown non parsati. Illeggibile.

**Soluzione**

`generate-pdf` (riscrittura completa):
- Parser markdown robusto via `marked` (npm import in Deno) → AST
- Render con `jspdf` + `jspdf-autotable` (già presenti) ma usando l'AST, non regex line-by-line
- Stile editoriale:
  - Cover page: logo IUSTA testuale (Playfair simulato con bold), titolo pratica, data, "Report Tecnico-Giuridico"
  - Tipografia: Helvetica per ora (jsPDF nativo) — titoli 18/14/12pt navy, corpo 11pt grigio scuro 1.5 line-height
  - Tabelle parsate correttamente (header oro chiaro, righe alternate)
  - Box "Contraddizione" rosso soft con bordo sinistro
  - Header/footer su ogni pagina
- Strip emoji (già fatto) ma preservare formattazione semantica

`generate-docx` (sostituzione completa):
- Usare libreria `docx` (npm import via esm.sh in Deno) per generare un vero file `.docx` (non `.txt`)
- Stessa struttura: cover, headings (Heading1/2/3 stile IUSTA), paragrafi, liste, tabelle, blockquote
- Font: Calibri 11pt corpo, Cambria 14-20pt titoli (universalmente disponibili in Word)
- Margini 2.5cm, header con "IUSTA" + footer con paginazione
- File scaricato come `.docx` reale apribile in Word/Pages

`Google Docs (apri con)`:
- L'attuale upload HTML → Google Docs Viewer mostra solo l'HTML senza conversione
- Soluzione: caricare il `.docx` generato sopra in bucket `reports`, poi aprire `https://docs.google.com/viewer?url=...&embedded=false` oppure usare `https://docs.google.com/document/create?usp=docs_home` con import URL
- Alternativa più affidabile: link diretto al `.docx` pubblico → l'utente fa "Apri con Google Docs" da Drive (mostriamo istruzione breve nel toast)
- In `DownloadDialog.tsx`: opzione "Apri con Google Docs" carica il .docx e apre `https://docs.google.com/viewer?url={publicDocxUrl}` in nuova tab

## File coinvolti

**Nuovi**
- `src/components/BentoGrid.tsx`, `BentoCard.tsx`
- `src/components/AnalysisChecklist.tsx`
- `src/components/ContradictionModal.tsx`
- `src/components/SmartDraftingSidebar.tsx`
- `supabase/functions/draft-suggestions/index.ts`
- `supabase/functions/generate-fascicolo/index.ts`

**Modificati**
- `index.html` (Google Fonts)
- `tailwind.config.ts` (fontFamily, spacing)
- `src/index.css` (palette navy/oro, glassmorphism utilities, base typography)
- `src/pages/Index.tsx` (Bento layout, checklist)
- `src/components/ReportView.tsx` (highlight contraddizioni, sidebar drafting, bottone Fascicolo Pro)
- `src/components/DownloadDialog.tsx` (Google Docs via .docx)
- `supabase/functions/generate-pdf/index.ts` (riscrittura con marked + AST)
- `supabase/functions/generate-docx/index.ts` (riscrittura con libreria `docx` reale)

**Non toccati**: schema DB, auth, routing principale, file `client.ts`/`types.ts`.

## Note
- Tema forzato dark (toggle light disabilitato sulla dashboard principale; resta solo sulle pagine secondarie se necessario)
- Tutti i colori passano per token semantici (no `text-white`/`bg-black` diretti)
- Nessuna nuova dipendenza npm lato client necessaria; le librerie pesanti (`marked`, `docx`) vengono caricate in edge function via `esm.sh`
