

## Piano: Nuova interfaccia Analisi + Pagina Modelli

Due macro-interventi: (1) ridisegnare la pagina Analisi con upload strutturato, info pratica e impostazioni analisi, e (2) aggiungere la sezione "Modelli" nella sidebar. Il report dell'agente seguirà la struttura della seconda immagine, mantenendo la possibilità di chattare dopo l'analisi. Colori invariati.

---

### 1. Pagina Analisi — Nuova interfaccia a step

**Stato iniziale (pre-analisi):**
- **Stepper orizzontale** in alto: `1 Caricamento → 2 Elaborazione → 3 Analisi IA → 4 Report`
- **Zona upload** drag & drop prominente al centro
- **Sidebar destra** con:
  - "Suggerimenti" (documenti consigliati: Verbali, CID/CAI, Referti, Foto, Perizie)
  - "Impostazioni analisi" (Modalità Completa/Rapida, Livello dettaglio Standard/Avanzato, toggle OCR avanzato, toggle Anonimizzazione, indicatore RAG attivo)
- **Lista "File caricati"** con nome, dimensione, stato OCR, bottone elimina
- **Sezione "Informazioni pratica (opzionale)"**: Titolo pratica, Numero pratica, Note
- **Card "Privacy e sicurezza"** nella sidebar destra
- **Bottone "Avvia analisi"** grande in basso con tempo stimato

**Stato report (post-analisi):**
- Header con titolo pratica, numero, data, bottoni "Esporta" e "Scarica PDF"
- **Indice laterale** a sinistra (Scheda Sinistro, Cronistoria, Analisi Tecnica, Contraddizioni, Violazioni CdS, Responsabilità, Svolgimento Fatto, Dati Mancanti)
- **Sezioni strutturate** del report: Scheda Sinistro (tabella), Cronistoria (tabella), Analisi Tecnica, Contraddizioni e Punti Critici, Violazioni CdS (tabella con grado certezza), Ipotesi Responsabilità (barra colorata), Bozza Svolgimento del Fatto, Dati Mancanti, Note Privacy
- **Area chat** in basso per continuare la conversazione con l'agente dopo il report

**File coinvolti:**
- Riscrittura `src/pages/Index.tsx`
- Nuovo `src/components/AnalysisSettings.tsx`, `src/components/CaseInfoForm.tsx`, `src/components/AnalysisStepper.tsx`, `src/components/ReportView.tsx`
- Modifica `src/components/FileUploadZone.tsx` — stile più grande, lista file con stato OCR
- Modifica `src/lib/case-storage.ts` — aggiungere campi `titoloPratica`, `numeroPratica`, `note`

### 2. Pagina Modelli (Templates operativi)

Nuova pagina `/modelli` con template documenti legali per infortunistica:

- **Lista template**: Atto di citazione, Comparsa di costituzione, Messa in mora assicurazione, Richiesta risarcimento danni, Diffida, Transazione stragiudiziale, Istanza di accesso atti
- Ogni template ha un **selettore caso** (dropdown dallo storico) per collegarlo a un caso
- Bottone **"Genera documento"** invia al chat edge function un prompt specifico per generare il documento con i dati del caso
- Documento generato con copia/scarica PDF

**File coinvolti:**
- Nuovo `src/pages/Modelli.tsx`, `src/lib/templates.ts`
- Modifica `src/components/AppSidebar.tsx` — voce "Modelli" con icona `FileText` sopra Settings
- Modifica `src/App.tsx` — rotta `/modelli`

### 3. Dettagli tecnici

- Le impostazioni analisi vengono passate all'edge function `chat` come parametri nel body, il system prompt si arricchisce di conseguenza
- Il ReportView parsa il markdown per estrarre sezioni e renderizzarle in card/tabelle, con fallback al markdown raw
- La generazione template usa lo stesso edge function `chat` con system prompt dedicato alla generazione documenti legali
- I dati pratica vengono salvati nel caso in localStorage

