
# Piano di implementazione

Lavoro suddiviso in 6 fasi indipendenti. Tutte le UI seguono lo stile Liquid Glass già definito (`GlassCard`, `.glass-strong`, `.liquid-action`).

---

## Fase 1 — Source Evidence & PDF Viewer avanzato

Estendere `src/components/SourceEvidence.tsx` e creare `src/components/PdfViewer.tsx`.

- Stato `loading | ready | error` durante `createSignedUrl`; mostrare `Skeleton` mentre carica.
- Retry automatico (max 2) + pulsante "Ricarica documento" in caso di errore o URL scaduto (>10 min).
- Installare `@react-pdf-viewer/core` + `@react-pdf-viewer/page-navigation` per rendering inline con `jumpToPage()`.
- Pulsante flottante "Vai a pag. N" dentro il viewer che chiama `pageNavigationPluginInstance.jumpToPage(n-1)` e applica un overlay dorato animato (fade 1.5s) sulla pagina.
- Fallback `<embed src="...#page=N">` se la lib pesa troppo.
- Toast d'errore descrittivo via `sonner` invece di fallimento silenzioso.

## Fase 2 — Export reale multi-formato

Aggiornare `src/components/DownloadDialog.tsx` in un `DropdownMenu` Liquid Glass con 3 voci:

1. **PDF Professionale** → edge function esistente `generate-pdf` (già funzionante).
2. **Documento Word (.docx)** → edge function esistente `generate-docx`.
3. **Fascicolo Completo (.zip)** → edge function esistente `generate-fascicolo`.

Refactor logica di download in `src/lib/download.ts`:
- Funzione unica `triggerDownload(blob, filename)` che usa `URL.createObjectURL` + `<a download>` temporaneo + `revokeObjectURL`.
- Naming pulito: `IUSTA_Report_{titoloPratica}_{YYYY-MM-DD}.{ext}`.
- Stato loading per voce, toast successo/errore, gestione errori Supabase con messaggio leggibile.
- Micro-animazioni `data-[state=open]:animate-in fade-in zoom-in-95` sul dropdown.

Non riscriviamo la generazione lato client con `jspdf`: le edge function attuali producono PDF/DOCX già stilizzati IUSTA, sono più affidabili. Verrà documentato nella risposta.

## Fase 3 — Sharing operativo (già DB-pronto)

Tabella `shared_reports` esiste (token + password_hash + expires_at + view_count).

- Rifinire `ShareDialog.tsx`: opzioni scadenza 24h/7g/30g/Permanente, password opzionale, pulsante "Copia Link" con feedback "Copiato!" via `navigator.clipboard.writeText`, toast Liquid Glass.
- `SharedReport.tsx`: gate password (se `passwordRequired`), rendering read-only del report con header brandizzato IUSTA, pulsante "Scarica PDF" usando la stessa logica di Fase 2 (no editing), gestione errori (`Link scaduto`, `Password errata`, `Link non valido`).
- Verifica edge function `get-shared-report` (incremento view_count già presente; semplifico la query).

## Fase 4 — Pagina `/privacy` (Trust Center)

Nuova route `src/pages/Privacy.tsx` registrata in `App.tsx` dentro `AppLayout`. Link nel footer + nella futura pagina Login.

- Hero: titolo serif "La tua riservatezza è il nostro asset più prezioso", sottotitolo "Tecnologia Bancaria applicata al Legal Tech".
- **Bento Grid 2×2** con `GlassCard interactive glow="gold"`:
  1. GDPR Compliance UE — icona `ShieldCheck` oro
  2. Zero-Data Retention — icona `EyeOff`
  3. Crittografia AES-256 (SSL/TLS + at-rest) — icona `Lock`
  4. Accesso Protetto — icona `Server`
- Icone oro `#D4AF37` con `drop-shadow` glow.
- Sezione citazione "Analisi protetta da segreto professionale: l'IA agisce come un assistente cieco che elabora e dimentica."
- CTA Liquid Glass "Scarica il Certificato di Compliance" (mockup: genera PDF placeholder lato client).

## Fase 5 — Pagina Login "Pearl Liquid Glass"

Nuova route pubblica `src/pages/Login.tsx` (no auth backend reale per ora — solo UI, redirect su `/`).

- Background: gradiente radiale lavanda/blu polvere + 4-5 div "pearl" (`border-radius:50%`, gradiente radiale bianco perla, blur 20-40px, glow esterno) posizionati asimmetricamente, animazione `@keyframes float` 8-12s ease-in-out infinite alternate.
- Card centrale: `rounded-[32px]`, `backdrop-blur-[40px] saturate-150`, `bg-white/10`, border `border-white/40`, shadow diffusa `0 30px 80px -20px rgba(0,0,0,0.15)`.
- Input "pillola" trasparenti con icone `User` / `Lock` interne, placeholder bianco/60.
- Bottone LOGIN: pillola con gradiente oro tenue (`from-[#D4AF37] to-[#B8941F]`), testo uppercase bold scuro.
- Checkbox "Remember me" liquid + link "Forgot password?".
- Sotto il CTA: "Accesso riservato ai partner certificati IUSTA". **Nessun link di registrazione.**
- Logo IUSTA in alto con effetto metallico (gradient + drop-shadow).
- Fade-in animato della card al mount.

## Fase 6 — Refactor analisi (Bento Strategic Report)

Refactor `src/components/ReportView.tsx` (mantenendo dati esistenti) in layout Bento:

- **Card "Verdetto di Responsabilità"**: blocco prominente con `LiquidProgress` graduato (es. 70% / 30%) + barra split rosso-soft / verde-smeraldo. Parsing del riassunto: estrarre percentuali se presenti; fallback testuale.
- **Card "Contraddizioni Rilevate"**: lista interna con badge gravità ("BUGIA TECNICA" `bg-red-500/15 text-red-300`, "INCONGRUENZA TESTIMONIALE" `bg-orange-500/15`). Click → `ContradictionModal` esistente esteso con dettagli espandibili.
- **Card "Dinamica del Sinistro"**: timeline verticale con marker oro.
- Ogni punto ha un `<SourceEvidence>` per la prova.
- **Card "Bozza Atto di Citazione"**: stile "carta pregiata" (`bg-stone-50/95 dark:bg-stone-100/5` con texture sottile SVG noise), pulsante "Copia Testo" con feedback.
- **Floating Action Bar** in basso (`fixed bottom-6 left-1/2 -translate-x-1/2`) Liquid Glass con: "Scarica PDF", "Condividi", "Esporta Word" — collegati a Fase 2/3.
- Tipografia: `font-serif` (Playfair) per titoli sezione, `font-mono` per dati tecnici (velocità, distanze, articoli).
- Colori: rosso `#EF4444`, verde `#10B981`, oro `#D4AF37` per articoli di legge.

---

## File toccati (stima)

**Nuovi**
- `src/pages/Privacy.tsx`
- `src/pages/Login.tsx`
- `src/components/PdfViewer.tsx`
- `src/lib/download.ts`

**Modificati**
- `src/App.tsx` (route `/privacy`, `/login`)
- `src/components/SourceEvidence.tsx` (loading/retry, viewer)
- `src/components/DownloadDialog.tsx` (dropdown 3 formati + filename)
- `src/components/ShareDialog.tsx` (UI rifinitura)
- `src/pages/SharedReport.tsx` (gate password + download PDF)
- `src/components/ReportView.tsx` (Bento layout + FAB)
- `src/components/ContradictionModal.tsx` (dettagli espandibili)
- `src/components/AppSidebar.tsx` / footer (link Privacy)
- `src/index.css` (keyframes `float` per perle, `pageHighlight` per viewer)
- `supabase/functions/get-shared-report/index.ts` (cleanup query view_count)

**Dipendenze nuove**
- `@react-pdf-viewer/core`, `@react-pdf-viewer/page-navigation`, `pdfjs-dist`

## Out of scope
- Auth reale (la pagina Login resta UI con redirect simulato finché non chiedi Lovable Cloud Auth).
- Riscrittura PDF/DOCX lato client con `jspdf`/`docx`: le edge function esistenti sono già operative e producono output di qualità superiore.
- Modifiche a `src/integrations/supabase/{client,types}.ts`.

## Verifica
1. `/` → analisi → "Scarica" mostra dropdown 3 formati → ognuno scarica file con nome corretto.
2. Click "Vedi Fonte" su una contraddizione → viewer carica PDF alla pagina giusta, pulsante "Vai a pag. N" funziona.
3. "Condividi" → genera link → apertura in incognito → password gate → report read-only + download PDF.
4. `/privacy` raggiungibile, 4 blocchi Bento renderizzati con icone oro.
5. `/login` mostra perle animate, card glass, nessun link registrazione.
6. Report renderizzato come Bento con FAB in basso.
