

## Piano: Download modal, sidebar auto-collapse, persistenza Modelli, grafiche report

### Richieste dell'utente

1. Sostituire i bottoni PDF/DOCX con un unico bottone "Scarica" che apre un dialog modale con opzioni (PDF, DOCX, Google Documenti)
2. Aggiungere opzione "Google Documenti" (apre il .doc generato via Google Docs import URL)
3. Persistenza stato Modelli tra navigazioni (come per Analisi)
4. Auto-collassare la sidebar sinistra quando l'analisi/modello viene completato
5. Report visivo che rispecchi fedelmente la foto di riferimento (Scheda Sinistro con tabella veicoli, Cronistoria con badge "Attendibilità", Analisi Tecnica della Dinamica, Contraddizioni con bullet rossi, Violazioni CdS con tabella e grado certezza, Ipotesi Responsabilità con barra colorata, Svolgimento del Fatto, Dati Mancanti, Note Privacy) — sia per analisi rapida che completa
6. Verificare che le esportazioni funzionino correttamente

**Riguardo alla Service Role Key**: non è possibile condividere chiavi segrete del backend. Per connetterti a strumenti esterni puoi usare l'anon key (pubblica) oppure creare una API key dedicata tramite un'edge function.

---

### Implementazione

**1. Download Dialog (`src/components/DownloadDialog.tsx`)** — Nuovo
- Dialog/modal con 4 opzioni: PDF (HTML), Word (.doc), DOCX, Google Documenti
- Google Documenti: genera il .doc, lo carica come blob, poi apre `https://docs.google.com/document/?action=upload` — oppure più semplicemente genera l'HTML e apre una finestra Google Docs con import
- Ogni opzione con icona e descrizione

**2. Persistenza Modelli (`src/contexts/ModelliContext.tsx`)** — Nuovo
- Contesto globale simile ad AnalysisContext per mantenere: selectedTemplate, selectedCaseId, generatedDoc
- Wrap in AppLayout accanto ad AnalysisProvider
- Modelli.tsx usa questo context invece di stato locale

**3. Auto-collapse sidebar sinistra**
- In `AppLayout.tsx`: esporre `toggleSidebar` dal `SidebarProvider`
- In `Index.tsx`: quando `onDone` viene chiamato (analisi completata), collassare la sidebar
- In `Modelli.tsx`: idem quando generazione template completata
- Approccio: aggiungere una callback `onCollapseSidebar` nel context o usare `useSidebar()` direttamente nelle pagine

**4. ReportView restyling fedele alla foto**
- Aggiungere sezione "Scheda Sinistro" con tabella dati (Data, Ora, Località, Meteo, Stato asfalto) e sotto-tabelle Veicolo A/B e Testimoni — con bordi e sfondo come in foto
- "Cronistoria dei Fatti" con colonne Orario, Evento, Soggetto, Fonte, Attendibilità (badge colorato Alta/Media/Bassa)
- "Analisi Tecnica della Dinamica" con icona ingranaggio e sfondo card chiaro
- "Contraddizioni e Punti Critici" con bordo rosso e icona rossa
- "Violazioni CdS" come tabella con colonne Articolo, Descrizione, Ipotesi violazione, Grado certezza (badge)
- "Ipotesi Responsabilità" con barra colorata proporzionale (rosso/verde)
- "Svolgimento del Fatto" con sfondo beige/crema
- "Dati Mancanti" con bordo rosso e icona alert
- "Note Privacy" con sfondo grigio chiaro
- Aggiornare `sectionAnchors` per tutte le sezioni
- Aggiornare i custom renderers di ReactMarkdown per matchare i nuovi titoli

**5. Aggiornare Index.tsx**
- Rimuovere i bottoni PDF/DOCX dal ReportView header
- Aggiungere un unico bottone "Scarica" che apre il DownloadDialog
- Passare gli handler di export al dialog

**6. Aggiornare `generate-pdf` edge function**
- Attualmente genera HTML, non PDF reale. Rinominare il content-type e assicurarsi che il file sia apribile come .html (che può essere stampato come PDF dal browser)

### File coinvolti
- **Nuovi**: `src/components/DownloadDialog.tsx`, `src/contexts/ModelliContext.tsx`
- **Modificati**: `src/components/ReportView.tsx` (restyling completo + rimozione bottoni export + bottone Scarica), `src/pages/Index.tsx` (auto-collapse sidebar, passare handler al dialog), `src/pages/Modelli.tsx` (usare ModelliContext), `src/components/AppLayout.tsx` (wrap ModelliContext), `src/components/AppSidebar.tsx` (branding "IUSTA")

