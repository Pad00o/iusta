

## Piano: Sidebar con navigazione + Storico Analisi + Settings

### Struttura

L'app passa da pagina singola a layout con sidebar ispirata all'immagine di riferimento (stile SinthAutomation). Tre sezioni navigabili:

1. **Analisi** — la chat attuale con il bot (pagina principale)
2. **Storico** — lista di tutti i casi analizzati, organizzabili in cartelle, riapribili con la chat originale
3. **Settings** — pagina impostazioni (placeholder iniziale)

### Modifiche tecniche

**1. Layout con Sidebar (`src/components/AppSidebar.tsx` + `src/components/AppLayout.tsx`)**
- Sidebar con logo LegalAgent in alto, sezione "Navigazione" con 3 voci: Analisi, Storico, Settings
- Icone coerenti (MessageSquare, FolderClock, Settings)
- Stile pulito, sfondo bianco, voce attiva evidenziata in blu/viola come nel riferimento
- Layout wrapper con SidebarProvider che avvolge tutte le pagine

**2. Gestione casi in localStorage (`src/lib/case-storage.ts`)**
- Ogni caso ha: id, titolo (auto-generato dal primo messaggio), messaggi, data creazione, cartella (opzionale)
- Funzioni: salvaCaso, caricaCaso, listaCasi, eliminaCaso, creaCCartella, spostaCasoInCartella
- Il caso viene salvato automaticamente dopo ogni risposta dell'agente
- Il caso attivo viene tracciato con un ID in stato React

**3. Pagina Analisi (`src/pages/Index.tsx`)**
- Refactoring per supportare caricamento di un caso esistente da localStorage
- Quando si apre un caso dallo storico, la chat si popola con i messaggi salvati
- Bottone "Nuova Analisi" crea un nuovo caso

**4. Pagina Storico (`src/pages/Storico.tsx`)**
- Lista di tutti i casi con titolo, data, anteprima primo messaggio
- Sistema cartelle: cartella "Tutti" di default + cartelle personalizzate creabili dall'utente
- Possibilità di spostare casi nelle cartelle via dropdown
- Click su un caso → naviga a `/` con quel caso caricato
- Eliminazione caso con conferma

**5. Pagina Settings (`src/pages/Settings.tsx`)**
- Placeholder con sezioni future (tema, export, info agente)

**6. Routing (`src/App.tsx`)**
- Aggiunta rotte `/storico` e `/settings`
- Layout wrapper con sidebar su tutte le rotte

### File coinvolti
- Nuovo: `src/components/AppSidebar.tsx`, `src/components/AppLayout.tsx`, `src/lib/case-storage.ts`, `src/pages/Storico.tsx`, `src/pages/Settings.tsx`
- Modificati: `src/App.tsx`, `src/pages/Index.tsx`

