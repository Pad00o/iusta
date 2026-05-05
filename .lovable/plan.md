## Piano: Loading bar neon, export PDF/TXT corretti, apertura Google Docs e miglioramenti UI/UX

### 1. Barra di caricamento neon stile foto

Sostituire l'attuale spinner "puntini" con una barra di caricamento azzurra luminosa (effetto neon glow) animata mentre l'AI analizza:

- Nuovo componente `src/components/NeonProgressBar.tsx`: barra orizzontale con gradient `from-cyan-400 via-blue-400 to-cyan-300`, `box-shadow` blu (effetto bagliore), animazione fill 0→95% durante streaming, snap a 100% quando `onDone`
- Etichetta "Analisi in corso..." con percentuale dinamica
- Stati testuali rotanti per dare feedback ("Estrazione testo dai documenti...", "Cross-check contraddizioni...", "Identificazione violazioni CdS...", "Redazione bozza atto...")
- Mostrato in `Index.tsx` nella fase `processing` (prima che arrivi il primo chunk) e in `ReportView.tsx` in cima allo scroll quando `isLoading && !reportMessage`

### 2. Export PDF reale (non più HTML rinominato)

L'attuale edge function `generate-pdf` restituisce HTML — il browser non lo apre come PDF. Sostituire con generazione PDF vera:

- Riscrivere `supabase/functions/generate-pdf/index.ts` usando **jsPDF** (`https://esm.sh/jspdf@2.5.1`) + **jspdf-autotable** per le tabelle
- Parser markdown → istruzioni jsPDF: titoli (size/colore differenziati), paragrafi con word-wrap, tabelle con autoTable, bullet list, blockquote per "Svolgimento del Fatto" con sfondo crema
- Header con logo testuale "⚖️ IUSTA" e linea blu, footer con numero pagina e data
- Font: Helvetica (built-in, leggibile, professionale). Niente emoji renderizzati come testo (li sostituiamo con marker testuali tipo "[!]", "[OK]") per evitare i quadratini
- Content-Type: `application/pdf`, filename `.pdf`
- Stile testuale chiaro: titoli sezione 14pt bold blu navy, corpo 11pt nero, line-height 1.5, margini 2cm

### 3. Export DOCX → in realtà file `.txt` leggibile

L'utente vuole semplicemente leggere il testo, non l'HTML soup. Trasformare la funzione `generate-docx` in generazione di **plain text formattato**:

- Riscrivere `generate-docx/index.ts`: convertire markdown → testo strutturato:
  - `# Titolo` → `═══ TITOLO ═══` in maiuscolo
  - `## Sezione` → `── Sezione ──`
  - `### Sottosezione` → `• Sottosezione`
  - Tabelle markdown → tabelle ASCII allineate (padding colonne)
  - Bullet `-` → `  • `
  - `**bold**` → testo nudo (no markup)
  - Rimuovere tag HTML residui
  - Line-wrap a 100 caratteri
- Header testuale:
  ```
  ════════════════════════════════════════
       IUSTA — Report Analisi Tecnico-Giuridica
  ════════════════════════════════════════
  Pratica: ...
  Data: ...
  ```
- Footer testuale con data generazione
- Content-Type: `text/plain; charset=utf-8`, filename `.txt`
- Aggiornare `DownloadDialog.tsx`: rinominare voce "DOCX" → "Testo (.txt)" con descrizione "File di testo semplice, leggibile ovunque"
- Aggiornare `Index.tsx` `handleExportDocx`: cambiare extension `.doc` → `.txt`

### 4. Apertura diretta in Google Docs

Per aprire davvero il documento in Google Docs (non scaricare HTML), serve che il file sia **accessibile via URL pubblico**: poi possiamo aprire l'importer di Google.

- Nuova edge function `upload-report` (o estensione di `generate-pdf`):
  - Genera l'HTML formattato del report
  - Lo carica su **Supabase Storage** in un bucket pubblico `reports` (creato via migrazione, public read)
  - Ritorna URL pubblico
- Nel `DownloadDialog`, voce "Google Documenti":
  1. Chiama l'edge function per generare e uploadare HTML
  2. Apre in nuova tab: `https://docs.google.com/viewer?url=<ENCODED_URL>` (visualizzazione) **oppure** `https://docs.google.com/document/u/0/?usp=docs_alc&urp=` con istruzione "File → Importa" (limite Google: l'auto-import di un URL esterno richiede OAuth Drive del singolo utente)
- Approccio pragmatico raccomandato (no OAuth utente): **Google Docs Viewer** read-only via URL pubblico — apre direttamente il file in una pagina Google. Per modifica reale sarà necessaria un'integrazione OAuth Drive futura (segnalata)
- Migrazione SQL: creare bucket pubblico `reports` con policy lettura pubblica e scrittura solo da service role

### 5. Miglioramenti UI/UX dell'analisi

Modifiche per rendere l'analisi più comprensibile:

**A. Pagina upload (`Index.tsx` fase upload)**:
- Aggiungere card riassuntiva con icone colorate dei 3 step (Carica → Configura → Analizza) sopra al form, per mostrare il flusso
- Tooltip su ogni opzione di `AnalysisSettings` (es. cosa fa "OCR avanzato", cosa significa "Anonimizzazione")
- Bottone "Avvia analisi" più grande con icona pulsante quando ci sono file caricati

**B. Pagina processing**:
- Schermata dedicata con barra neon centrale, log live degli step ("Lettura file 1/3...", "Estrazione testo OCR...", "Analisi GPT in corso...")
- Indicatore tempo elapsed (no stima totale, solo "00:42")

**C. Pagina report (`ReportView.tsx`)**:
- Toolbar sticky in cima con: bottone Scarica + bottone "Copia testo" + bottone "Riassumi in 3 punti" (chiama AI follow-up automatico)
- Sezione "Riepilogo esecutivo" generata automaticamente in cima (3-5 bullet chiave estratti dal report) — collassabile
- Highlight key facts: card colorata in cima con i 3 dati più importanti (responsabilità %, articoli CdS principali, prognosi)
- Mini-mappa di scroll a destra con indicatori colorati delle sezioni critiche
- Modalità "Stampa amichevole" (toggle per nascondere indice e mostrare layout pulito)

### 6. Miglioramenti generali sistema (suggerimenti aggiuntivi)

**Backend**:
- Salvare anche i file caricati (non solo i messaggi) in Supabase Storage per ri-analizzare casi vecchi
- Aggiungere campo `report_summary` in tabella `cases` (3 bullet auto-generati) per anteprima rapida nello Storico
- Aggiungere status `cases.status` (`bozza`, `completato`, `archiviato`)
- Edge function `regenerate-section`: rigenera solo una sezione specifica del report (es. solo "Svolgimento del Fatto")
- Logging strutturato delle analisi (durata, tokens, modello usato) per analytics

**Funzionalità**:
- Sistema di **cartelle/etichette** per organizzare casi nello Storico (già parzialmente con `folder` field)
- **Confronto tra casi**: selezionare 2 casi e vedere differenze (utile per casi simili)
- **Template di follow-up rapidi**: bottoni preconfigurati ("Calcola danno biologico", "Stima risarcimento", "Estrai testimoni")
- **Esportazione multipla**: selezionare più casi nello Storico → ZIP con tutti i report
- **Versioning report**: salvare snapshot quando si fanno follow-up, per tornare a versioni precedenti
- **Notifiche browser** quando l'analisi è completa (utile per analisi lunghe)

**UI generale**:
- Tema chiaro/scuro toggle
- Shortcut tastiera (Cmd+K command palette per navigare casi)
- Onboarding tour al primo accesso
- Stato "offline" gestito con messaggio chiaro

**Sicurezza/Auth** (priorità alta):
- Implementare autenticazione utente (email + Google OAuth) — attualmente i casi sono pubblicamente leggibili da chiunque
- RLS sui casi: solo il proprietario vede i propri
- Audit log accessi

### File coinvolti

- **Nuovi**: 
  - `src/components/NeonProgressBar.tsx`
  - `src/components/ProcessingScreen.tsx` (schermata processing dedicata)
  - `supabase/migrations/<timestamp>_reports_bucket.sql` (bucket Storage pubblico)
- **Modificati**:
  - `supabase/functions/generate-pdf/index.ts` (jsPDF reale)
  - `supabase/functions/generate-docx/index.ts` (output .txt formattato)
  - `src/components/DownloadDialog.tsx` (rinomina DOCX→TXT, Google Docs via URL pubblico)
  - `src/pages/Index.tsx` (extension .txt, integrare ProcessingScreen e NeonProgressBar)
  - `src/components/ReportView.tsx` (toolbar sticky, riepilogo esecutivo, highlight cards)
  - `src/components/AnalysisSettings.tsx` (tooltip)

### Note tecniche

- jsPDF non supporta nativamente emoji nei font built-in: li sostituiremo con marker testuali nel PDF (la versione web continua a mostrare gli emoji)
- Google Docs "apri direttamente" con modifica richiede OAuth utente Drive — per ora apriamo Google Docs Viewer (read-only) via URL pubblico. Per modifica reale serve setup OAuth dedicato (proposta futura)
- Il bucket Storage `reports` sarà pubblico: i file conterranno solo dati già anonimizzati dall'opzione "Anonimizzazione"
