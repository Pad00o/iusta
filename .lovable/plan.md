

## Piano: Miglioramenti UI, persistenza database, e nuove funzionalità

### 1. Database — Tabella `cases` e `folders`

Creazione tabelle in Supabase per salvare i casi (attualmente in localStorage):

**Tabella `cases`**: `id` (uuid PK), `title` (text), `messages` (jsonb), `titolo_pratica` (text), `numero_pratica` (text), `note` (text), `folder` (text nullable), `created_at` (timestamptz), `updated_at` (timestamptz)

**Tabella `folders`**: `id` (uuid PK), `name` (text unique), `created_at` (timestamptz)

RLS: accesso libero (no auth come richiesto). Aggiornamento di `case-storage.ts` per usare Supabase invece di localStorage.

### 2. Storico — Ricerca e filtri data

- Campo di ricerca in alto per filtrare per titolo/contenuto
- Filtro per intervallo date (da/a) con input date
- Design più curato con header e contatori

### 3. Upload .docx

- Aggiungere `application/vnd.openxmlformats-officedocument.wordprocessingml.document` ai tipi accettati in `FileUploadZone.tsx`
- Aggiornare l'attributo `accept` dell'input e il testo descrittivo

### 4. Rimuovere tempo stimato e icona orologio

- In `Index.tsx` eliminare le righe 259-262 (Clock icon + "Tempo stimato: ~2-4 min")
- Rimuovere import `Clock`

### 5. Report page — Design ispirato alla foto

Ridisegno di `ReportView.tsx` per replicare la struttura dell'immagine di riferimento:
- Header con logo LegalAgent, badge "REPORT DI ANALISI", pratica, data, bottoni Esporta/Scarica PDF
- Indice laterale sinistro con icone colorate per ogni sezione (Scheda Sinistro, Cronistoria, Analisi Tecnica, Contraddizioni, Violazioni CdS, Responsabilità, Svolgimento Fatto, Dati Mancanti)
- Sezione Documenti con conteggio file analizzati
- Sezioni del report in card con bordi e icone colorate come nell'immagine
- Tabelle stilizzate con header colorati per Cronistoria e Violazioni CdS
- Card "Contraddizioni e Punti Critici" con bordo rosso/arancione
- Card "Ipotesi Responsabilità" con barra colorata
- Card "Dati Mancanti" con bordo rosso e icona alert
- Card "Note Privacy" con sfondo grigio chiaro
- Colori: blu per sezioni normali, rosso/arancione per criticità, verde per conferme

### 6. Sidebar destra collassabile

- In `Index.tsx` fase upload: la sidebar destra (AnalysisSettings) diventa un pannello collassabile
- Stato iniziale: chiuso (icona hamburger/ingranaggio in alto a destra per aprirlo)
- Si apre come overlay o pannello sliding da destra
- Bottone toggle visibile in alto a destra

### 7. Persistenza analisi tra navigazioni

- Lo stato dell'analisi corrente (messages, files, phase, caseInfo, config) viene mantenuto in un contesto React globale o tramite `useRef` che non si resetta al cambio rotta
- Quando l'utente torna su "Analisi" dopo aver visitato Storico/Modelli/Settings, ritrova l'analisi in corso
- Solo "Nuova Analisi" resetta lo stato
- Implementazione: spostare lo stato dell'analisi in un Context (`AnalysisContext`) wrappato nell'AppLayout

### 8. Bottone "Nuova Analisi" più bello

- Design gradient con icona sparkle/plus, bordo arrotondato, effetto hover con animazione
- Posizionato in modo prominente nel header del report

### File coinvolti
- **Migrazione DB**: creazione tabelle `cases` e `folders`
- **Modificati**: `src/lib/case-storage.ts` (Supabase), `src/pages/Index.tsx`, `src/pages/Storico.tsx`, `src/components/ReportView.tsx`, `src/components/FileUploadZone.tsx`
- **Nuovo**: `src/contexts/AnalysisContext.tsx` (contesto globale per persistenza stato analisi)
- **Modificati**: `src/components/AppLayout.tsx` (wrap con AnalysisContext)

