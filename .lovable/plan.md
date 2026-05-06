## Piano: Estensione completa backend, funzionalità e UI di IUSTA

Il piano copre **15 richieste** raggruppate in 3 aree. Data l'estensione, propongo di implementare tutto in un'unica iterazione coerente.

---

### 🗄️ BACKEND

**1. Storage file caricati**
- Nuovo bucket privato `case-files` (migrazione SQL + policy public read finché non c'è auth)
- Modificare `Index.tsx`: dopo l'upload, prima di chiamare `chat`, caricare ogni file su `case-files/{caseId}/{filename}`
- Nuova colonna `cases.uploaded_files JSONB` (array di `{name, path, size, type}`)
- Nello `Storico`, mostrare i file allegati con bottone "Ri-analizza"

**2. Campo `report_summary`**
- Nuova colonna `cases.report_summary TEXT` (3 bullet)
- Edge function dedicata `summarize-case` chiamata automaticamente al termine dell'analisi (Lovable AI, gemini-2.5-flash-lite, prompt: "estrai 3 bullet chiave dal report")
- Mostrato nelle card dello Storico sotto il titolo

**3. Campo `cases.status`**
- Enum `case_status` (`bozza`, `completato`, `archiviato`)
- Default `bozza`, `completato` quando l'analisi finisce
- Filtri nello Storico per status, bottone "Archivia" sulla card

**4. Edge function `regenerate-section`**
- Riceve `{ caseId, sectionTitle, currentReport }`, rigenera SOLO quella sezione
- Bottone "Rigenera sezione" su ogni heading H2/H3 in `ReportView.tsx`

**5. Logging analisi**
- Nuova tabella `analysis_logs` (`case_id`, `model`, `duration_ms`, `tokens_input`, `tokens_output`, `mode`, `created_at`)
- L'edge function `chat` scrive una riga al termine dello stream (con `usage` ritornato dal modello)
- Pagina `Analytics` minima sotto Settings con grafici aggregati (media durata, casi/giorno)

---

### ⚙️ FUNZIONALITÀ

**6. Cartelle/etichette migliorato**
- Già esiste `folders`. Aggiungere drag&drop case→folder nello Storico
- Bottone "Nuova cartella" inline, rinomina/elimina cartella

**7. Confronto tra casi**
- Modalità "Confronta": selezione multipla nello Storico, bottone "Confronta (2)"
- Pagina `/confronta?ids=a,b` con due colonne side-by-side dei report + diff highlight delle responsabilità %

**8. Template follow-up rapidi**
- Pulsanti preconfigurati sopra l'input nella fase report: "Calcola danno biologico", "Stima risarcimento", "Estrai testimoni", "Genera atto di citazione"
- Click → invia automaticamente il prompt corrispondente all'AI

**9. Esportazione multipla ZIP**
- Selezione multipla nello Storico → bottone "Esporta selezionati"
- Edge function `export-cases-zip` che genera ZIP (libreria `jszip` via esm.sh) con un PDF per ogni caso

**10. Versioning report**
- Nuova tabella `case_versions` (`case_id`, `snapshot JSONB`, `created_at`, `label`)
- Snapshot automatico prima di ogni follow-up
- Pannello "Cronologia versioni" in `ReportView.tsx` con possibilità di ripristino

**11. Notifiche browser**
- Richiesta permesso `Notification` al primo "Avvia analisi"
- Notifica quando l'analisi finisce e il tab non è attivo (`document.hidden`)

---

### 🎨 UI GENERALE

**12. Tema chiaro/scuro**
- `ThemeProvider` (next-themes già non installato → usare local context con `localStorage` + class su `<html>`)
- Toggle in `AppSidebar` footer (icona sole/luna)
- Verificare che tutti i token semantici di `index.css` abbiano variante `.dark`

**13. Command palette Cmd+K**
- Componente `CommandPalette.tsx` usando `cmdk` (già nelle deps via shadcn `command.tsx`)
- Listener globale `Cmd/Ctrl+K`, lista casi recenti, navigazione rapida (Nuova analisi, Storico, Modelli, Settings), ricerca full-text titolo caso

**14. Onboarding tour**
- Componente `OnboardingTour.tsx` con tooltip step-by-step (4 step: Sidebar, Upload, Settings, Storico)
- Mostrato solo al primo accesso (`localStorage.iusta_onboarding_done`)
- Bottone "Mostra tour" in Settings per rivederlo

**15. Stato offline**
- Hook `useOnlineStatus` (`navigator.onLine` + listener)
- Banner sticky in cima quando offline: "Sei offline. Le analisi non sono disponibili."
- Disabilitare bottoni "Avvia analisi" quando offline

---

### File coinvolti

**Migrazioni SQL**
- Bucket `case-files`, colonne `cases.uploaded_files/report_summary/status`, tabelle `analysis_logs`/`case_versions`

**Nuove edge functions**
- `summarize-case/index.ts`
- `regenerate-section/index.ts`
- `export-cases-zip/index.ts`

**Edge function modificate**
- `chat/index.ts` (logging usage)

**Nuovi componenti**
- `src/components/ThemeToggle.tsx`
- `src/contexts/ThemeContext.tsx`
- `src/components/CommandPalette.tsx`
- `src/components/OnboardingTour.tsx`
- `src/components/OfflineBanner.tsx`
- `src/components/CaseCompare.tsx`
- `src/components/VersionHistory.tsx`
- `src/components/QuickFollowupButtons.tsx`
- `src/hooks/useOnlineStatus.ts`
- `src/hooks/useBrowserNotifications.ts`
- `src/pages/Confronta.tsx`
- `src/pages/Analytics.tsx`

**Modificati**
- `src/pages/Index.tsx` (upload file → storage, notifiche, snapshot, follow-up buttons)
- `src/pages/Storico.tsx` (selezione multipla, drag&drop, summary, filtri status, ZIP export)
- `src/components/ReportView.tsx` (rigenera sezione, version history, quick followups)
- `src/components/AppLayout.tsx` (ThemeProvider, OfflineBanner, OnboardingTour, CommandPalette)
- `src/components/AppSidebar.tsx` (theme toggle)
- `src/lib/case-storage.ts` (nuovi campi)
- `src/App.tsx` (nuove route)

### Note
- Niente autenticazione in questo passaggio (i policy restano `true` come oggi); va aggiunta in un prossimo step dedicato
- Bucket `case-files` sarà pubblico finché non c'è auth — segnalo nel completamento
- Modulo zip e jspdf già usati
