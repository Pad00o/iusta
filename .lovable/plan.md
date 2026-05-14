# Piano: Elite Clarity + Liquid Glass + Fix Funzionali

## 1. Sistema colori e tipografia (index.css, tailwind.config.ts)

Aggiornare i token HSL in `src/index.css`:
- `--background`: `222 47% 11%` (Slate 900 #0F172A)
- `--card`: `217 33% 17%` (Slate 800 #1E293B), opacità 0.95 di default
- `--border`: `215 25% 27%` (Slate 700 #334155), spessore 1px pieno (rimuovere il `/0.1` globale sul `*`)
- `--foreground`: `210 40% 98%` (Slate 50 #F8FAFC)
- `--muted-foreground`: `215 20% 75%` (più chiaro, niente più grigi medi sul corpo)
- `--primary`: `43 73% 62%` (#E5C158 oro più luminoso), `--primary-foreground`: `222 47% 6%` (nero per contrasto sui CTA)
- `--destructive`: `0 84% 60%` (#EF4444) + utility `.contradiction-block` con bg `hsl(0 84% 60% / 0.08)` + border `hsl(0 84% 60% / 0.4)`

Tipografia:
- `body`: `font-size: 1rem; line-height: 1.7;`
- H1 in `gold-text` (Playfair), H2/H3 in `text-foreground` Playfair
- Padding minimo sezioni `p-8` (32px)

Rimuovere il gradiente radiale sul `body` (rumore visivo) o ridurlo molto.

## 2. Liquid Glass utilities (index.css)

Sostituire `.glass` / `.glass-strong` con stile Apple Liquid Glass:
```css
.glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.15),   /* highlight top-left */
    inset 0 -1px 0 rgba(255,255,255,0.05),    /* edge bottom */
    0 20px 50px -20px rgba(0,0,0,0.5);        /* outer soft shadow */
  transition: background 250ms ease, box-shadow 250ms ease;
}
.glass:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  box-shadow:
    inset 2px 2px 0 rgba(255,255,255,0.22),
    inset 0 -1px 0 rgba(255,255,255,0.06),
    0 24px 60px -20px rgba(0,0,0,0.55);
}
.glass-strong { /* solid panel for contenuti densi */
  background: hsl(217 33% 17% / 0.96);
  border: 1px solid hsl(215 25% 27%);
  border-radius: 24px;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.06), 0 20px 50px -20px rgba(0,0,0,0.5);
}
.liquid-pill { /* input + search */
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.14);
  border-bottom-color: rgba(255,255,255,0.28); /* bordo inferiore luminoso */
  border-radius: 9999px;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.1);
}
.icon-glass { /* sfondo icone */
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 16px;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.18), 0 0 14px rgba(229,193,88,0.15);
}
```

Applicare `liquid-pill` in `src/components/ui/input.tsx` (varianti via className override su componenti chiave: ricerca, prompt). Applicare `icon-glass` ai contenitori delle icone in `BentoGrid`, `AnalysisChecklist`, `DownloadDialog`, `ReportView` header, `AppSidebar` items.

Ridurre blur dove pesante (es. `backdrop-blur-xl` → `blur(20px)` via `.glass`).

## 3. Fix Theme toggle (Settings.tsx, ThemeContext.tsx, index.css)

Problema attuale: `index.css` definisce gli stessi token in `:root` e `.dark`, e l'HTML è forzato dark in `index.html`/CSS → toggle non ha effetto.

Soluzione:
- Spostare i token "scuri" SOLO in `.dark { ... }` e creare in `:root` una palette chiara coerente (background `210 40% 98%`, card `0 0% 100%`, foreground `222 47% 11%`, border `215 20% 85%`, primary invariato).
- Rimuovere `html:not(.light)` forzato e `color-scheme: dark` di default; lasciare al ThemeContext la classe `dark` su `<html>`.
- Verificare in `ThemeContext.tsx` che il toggle aggiunga/rimuova la classe correttamente (già lo fa). Testare in `Settings`.

## 4. ContradictionModal: evidenze precise (ContradictionModal.tsx + ReportView.tsx)

- Estendere `ContradictionData` con: `documentName?: string`, `pageNumber?: number`, `lineNumber?: number`, `documentUrl?: string` (link pubblico al file in bucket `case-files`).
- Mostrare nella card "Ritaglio Documento":
  - Header: nome documento + badge "Pag. X · Riga Y"
  - Pulsante "Apri documento al punto citato" → apre `documentUrl#page=X` in nuova tab
- In `ReportView.tsx`, quando si parsa il blocco contraddizione, estrarre eventuali pattern tipo `[doc: nome_file.pdf, p.3, l.12]` dal markdown e popolare i campi. Recuperare l'URL pubblico via `supabase.storage.from('case-files').getPublicUrl(path)` partendo da `case.uploaded_files`.
- Migliorare evidenziazione: highlight giallo morbido sull'excerpt + annotazione laterale "Citato da: <sezione report>".

## 5. Anteprima Fascicolo Pro nel DownloadDialog (DownloadDialog.tsx)

Aggiungere un pannello anteprima sopra le opzioni di scarica, visibile sempre:
- **Copertina** (rendering live): logo IUSTA stilizzato, titolo `titoloPratica`, data, "Fascicolo Tecnico-Legale"
- **Indice automatico**: estrazione delle headings H1/H2 dal `markdown` (regex `^##? `), numerate
- **Conteggio allegati**: numero file da `case.uploaded_files` (passato come prop)
- Layout: card glass-strong divisa in 2 colonne (copertina / indice) sopra la lista delle azioni di download

## 6. Rimozione DOCX

- Eliminare opzione "Word (.docx)" da `DownloadDialog.tsx` (rimuovere voce + prop `onExportDocx`)
- Aggiornare chiamate in `ReportView.tsx` (rimuovere handler export DOCX e import correlati)
- L'opzione "Apri in Google Documenti" continuerà internamente a generare un `.docx` temporaneo per il viewer (resta funzionante) — solo l'azione utente diretta di download DOCX viene rimossa
- Lasciare attiva e ben visibile: Fascicolo Pro (ZIP) + PDF + Google Documenti

## 7. Nessuna modifica
- Edge functions, schema DB, auth, routing, `client.ts`, `types.ts`

## File toccati
- `src/index.css`, `tailwind.config.ts`
- `src/components/ui/input.tsx`
- `src/components/DownloadDialog.tsx`
- `src/components/ContradictionModal.tsx`, `src/components/ReportView.tsx`
- `src/components/BentoGrid.tsx`, `src/components/AnalysisChecklist.tsx`, `src/components/AppSidebar.tsx` (applicare `icon-glass` / `glass`)
- `src/contexts/ThemeContext.tsx` (verifica), `src/pages/Settings.tsx` (verifica toggle)
