## Plan

Large multi-part request. I'll split into focused phases. Phase 1 fixes the broken Download button (regression) and is highest priority. Phases 2–4 add the requested features and polish.

### Phase 1 — Fix "Scarica" (download) regression

The dialog currently only opens Google Docs viewer + Fascicolo ZIP + PDF. The earlier flow also offered direct DOCX (and the user later said "elimina docx"), but now the menu itself appears broken. I'll:
- Re-verify `DownloadDialog` actions wire correctly to `generate-pdf`, `generate-fascicolo`, and `generate-docx` (Google Docs viewer path) edge functions.
- Restore three working options: **Fascicolo Pro (.zip)**, **PDF**, **Apri in Google Documenti**.
- Fix any broken `onExportPdf` prop call from `ReportView`.
- Add `DialogDescription` (silences the a11y warnings shown in console).
- Verify each button by calling the edge functions with `supabase--curl_edge_functions`.

### Phase 2 — Liquid Glass polish (consistency pass)

- Strengthen `.glass:hover` / `:active` reflection + bottom-border highlight in `src/index.css` for both light and dark themes (currently dark-leaning).
- Strengthen `.liquid-switch[data-state=checked]` with brighter gold inner glow + thumb highlight (light + dark parity).
- Replace remaining custom progress bars (e.g. in `AnalysisStepper.tsx`, any `<div>`-based bar in `ReportView.tsx`) with `<LiquidProgress />`.
- Apply `liquid-radio` / `liquid-switch` / `liquid-check` classes to **all** instances across `AnalysisSettings`, `Settings`, `CaseInfoForm`, `OnboardingTour`, including disabled state styling.
- Sweep wrappers in `ReportView`, `SmartDraftingSidebar`, `AnalysisChecklist`, `AnalysisStepper`, `BentoGrid`, `AppSidebar`, `ContradictionModal`, `DownloadDialog`, `Storico`, `Analytics`, `Confronta`, `Modelli`, `Settings` to use `<GlassCard>` / `.glass` / `.glass-strong`.

### Phase 3 — Source Evidence ("Vedi Fonte")

- Extend the report data model so each contradiction / key point can carry `sourceFile`, `pageNumber`, `snippet`, optional `bbox` coords (already partially in `ContradictionModal`).
- Update `supabase/functions/chat/index.ts` analysis prompt to ask the model to return citations with `{ file, page, quote }`.
- New component `src/components/SourceEvidence.tsx`:
  - Lucide `Eye` icon button next to each citation.
  - `Tooltip` on hover with a snippet preview.
  - Click opens new `SourceModal` (Liquid Glass): renders the original file from Supabase storage (`case-files` bucket) using `<embed>` for PDFs with `#page=N`, plus a highlighted snippet block.
  - Fallback when no PDF coords: show only the highlighted text snippet card.
- Wire it into `ContradictionModal` and `ReportView` (key-points section).

### Phase 4 — Secure Sharing ("Condividi Report")

Backend (single migration):
```sql
create table public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  token text not null unique,                 -- random URL-safe slug
  password_hash text,                          -- nullable
  expires_at timestamptz,                      -- nullable = never
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.shared_reports enable row level security;
create policy "anyone can read share by token" on public.shared_reports
  for select using (true);                     -- token itself is the secret
create policy "anyone can create shares" on public.shared_reports
  for insert with check (true);                -- public app, matches existing RLS pattern
```

Edge functions:
- `create-share`: input `{ caseId, expiresInHours|null, password|null }` → bcrypt-hash password, generate `token = crypto.randomUUID().replace(/-/g,'') + base36 ts`, return `{ url, expiresAt }`.
- `get-shared-report`: input `{ token, password? }` → verify expiry + password, increment view_count, return read-only case payload (title, markdown report, attachments list with signed URLs).

Frontend:
- New `ShareDialog` (Liquid Glass) triggered from `ReportView` header & Storico row actions:
  - Expiry select (`24h`, `7g`, `30g`, `Mai`).
  - Optional password input with show/hide toggle.
  - Generate → copy-to-clipboard + sonner toast: *"Link di collaborazione copiato. Scadrà tra 24 ore."*
- New route `/shared/:token` → `SharedReport.tsx`:
  - Branded IUSTA header (logo + glass strip).
  - Password gate when required.
  - Renders the report markdown read-only with PDF download button (re-uses `generate-pdf` via the edge function).
  - No edit affordances, no sidebar.
- Use Lucide `Share2`, `Lock`, `ExternalLink`, `Eye`.

### Out of scope
- No changes to `src/integrations/supabase/{client,types}.ts`.
- No auth changes (project is currently public per existing RLS).
- No edits to neon-themed `NeonProgressBar` neon variant.

### Verification
1. Open `/`, run an analysis, click **Scarica** → confirm Fascicolo, PDF, Google Docs all download/open.
2. Toggle theme → glass hover/active visible in both modes; switch glow visible in both.
3. Trigger analysis → liquid progress animates.
4. Click an "Eye" icon on a contradiction → SourceModal renders snippet (and PDF page when available).
5. Click **Condividi**, generate link with 24h + password → open in incognito → password prompt → read-only report renders → PDF download works.

### Estimated touched files
- Edited: `src/components/DownloadDialog.tsx`, `src/components/ReportView.tsx`, `src/components/ContradictionModal.tsx`, `src/components/AnalysisStepper.tsx`, `src/components/AnalysisSettings.tsx`, `src/components/SmartDraftingSidebar.tsx`, `src/components/BentoGrid.tsx`, `src/components/AppSidebar.tsx`, `src/components/ui/{switch,radio-group,checkbox,toggle,toggle-group}.tsx`, `src/index.css`, `src/App.tsx` (route), `src/pages/{Index,Storico,Settings,Analytics,Confronta,Modelli}.tsx`, `supabase/functions/chat/index.ts`.
- New: `src/components/SourceEvidence.tsx`, `src/components/SourceModal.tsx`, `src/components/ShareDialog.tsx`, `src/pages/SharedReport.tsx`, `supabase/functions/create-share/index.ts`, `supabase/functions/get-shared-report/index.ts`, migration for `shared_reports`.
