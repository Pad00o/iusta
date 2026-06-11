## Goals

Fix five UI/UX issues and run a fresh SEO + security review.

---

### 1. Center the "Nuovo cliente" / "Modifica cliente" dialog

In `src/pages/Clienti.tsx` the constant `dialogContentCentered` adds `top-1/2 -translate-y-1/2 max-h-[85vh]`. The shadcn `DialogContent` already centers via `top-[50%] translate-y-[-50%]`, but the override + `max-h-[85vh]` interaction is pushing the card down on tall viewports.

- Simplify `dialogContentCentered` to just `sm:max-w-md glass-strong max-h-[85vh] overflow-y-auto` (let the base Dialog handle vertical centering).
- Apply the same fix to the AlertDialog used for delete confirmation (remove the manual `top-1/2 -translate-y-1/2`).

### 2. Remove the broken "Condividi" feature

- Remove the `<ShareDialog />` usages from `src/components/ReportView.tsx` (header at line 165 and the duplicate at line 452).
- Delete `src/components/ShareDialog.tsx` and the `create-share` edge function references in the frontend imports.
- Leave the `shared_reports` table and edge function in place server-side (no DB migration needed). Just remove all UI entry points.

### 3. Clean up the "Scarica" dropdown wording

- Interpreting "remove the word function in the scarica function" as: remove the residual share-related copy near the Scarica button. After step 2 there should be no "Condividi" mentions next to it. Re-check `DownloadDialog.tsx` and surrounding header to confirm no leftover labels.
- If you meant something different (e.g. rename a specific item inside the Scarica dropdown), I'll need a screenshot — I'll ask before editing copy.

### 4. Keep the "INDICE" sidebar visible while scrolling the analysis

In `src/components/ReportView.tsx` the left index (`hidden lg:flex w-56 …`) currently sits next to the scrolling `ScrollArea`. On some viewports/zoom levels the nav itself can scroll off because the parent layout collapses.

- Make the nav explicitly sticky: wrap `<nav>` content with `sticky top-0 self-start max-h-[calc(100vh-3rem)] overflow-y-auto` and ensure the outer column is `h-full`.
- Add `scroll-mt-20` on each section anchor so clicking a title doesn't hide it under the report header.

### 5. SEO review

- Verify `index.html`: single `<h1>`, `<title>` under 60 chars with primary keyword (e.g. "IUSTA — Analisi infortunistica stradale"), `meta description` under 160 chars, `og:` + `twitter:` tags, canonical link, viewport meta, favicon, JSON-LD `SoftwareApplication`.
- Add `alt` attributes to any logo/image without them.
- Trigger an SEO scan via the SEO tool and surface results; only patch issues it flags.

### 6. Security review

- Re-run the security scan. The two outstanding scanner warnings (`SUPA_public_bucket_allows_listing`, `SUPA_rls_policy_always_true`) are already documented in security memory as intentional for this app's custom-auth architecture (server-side `verifyCaller` on edge functions, public buckets for share-link previews and white-label logos with anonymous write/delete removed).
- If the rescan surfaces anything new, fix it; otherwise reaffirm the existing decisions and update security memory if posture changed.

---

### Files touched (build phase)

- `src/pages/Clienti.tsx` — dialog centering
- `src/components/ReportView.tsx` — remove ShareDialog, sticky INDICE
- `src/components/ShareDialog.tsx` — delete file
- `index.html` (and `src/main.tsx` if needed) — SEO meta tweaks based on scan
- Possibly `mem://` security memory update after rescan

No database migrations, no edge-function changes.

### One open question

Could you confirm what "remove the word function in the scarica function" means? My best guess is "make sure no Condividi/Share label remains near the Scarica button after step 2." If you actually want a specific label inside the dropdown renamed (PDF / Word / Fascicolo), tell me which one.