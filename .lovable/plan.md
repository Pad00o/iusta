# Obiettivi

1. White-label esteso a **tutti** i PDF/DOCX/Fascicolo (Analisi + Modelli) quando il toggle è attivo.
2. Sync in tempo reale: aggiornamenti studio/logo visibili immediatamente sia all'admin (pagina Clienti) sia al cliente (Impostazioni).
3. Permessi: solo admin può creare/eliminare clienti; ogni cliente vede solo i propri dati.
4. Pulsante Condividi → modale centrata sempre funzionante (anche dal viewer/floating bar).
5. Dialog "Nuovo cliente" centrato verticalmente sullo schermo.

---

## 1. White-label su tutti i formati di export

**Frontend — `DownloadDialog.tsx`**
- Leggere `user` da `useAuth()` e inviare `studioName` + `studioLogo` (solo se `user.is_authorized`) a `generate-docx` e `generate-fascicolo`, esattamente come già avviene per `generate-pdf`.

**Edge function — `generate-docx/index.ts`**
- Accettare `studioName`, `studioLogo` nel body.
- Sostituire header/footer del file DOCX con `studioName` quando presente; inserire il logo come immagine inline nell'header.

**Edge function — `generate-fascicolo/index.ts`**
- Inoltrare `studioName` e `studioLogo` nella chiamata interna a `generate-pdf` (oggi non lo fa).
- Rinominare la cartella interna dello zip in `{Studio || "IUSTA"}_Fascicolo/`.

**Modelli (`Modelli.tsx`)** — già passa i campi a `generate-pdf`. Verificare che funzioni anche dopo il fix (nessuna modifica funzionale prevista).

---

## 2. Sync admin ↔ cliente in tempo reale

**`Clienti.tsx`**
- Aggiungere un dialog "Modifica cliente" (icona matita su ogni `ClientCard`) per cambiare `studio`, `pagano`, `logo_url` direttamente dall'admin.
- Sottoscrizione realtime alla tabella `app_users` (`supabase.channel('app_users').on('postgres_changes', ...)`) per riflettere modifiche fatte dai clienti in Impostazioni.

**`AuthContext.tsx` / `Settings.tsx`**
- In `Settings.tsx` aggiungere una sottoscrizione realtime sulla **propria** riga `app_users` (filter `id=eq.<user.id>`): a ogni `UPDATE` chiamare `refreshUser()` così l'utente vede in pochi secondi le modifiche fatte dall'admin (es. nuovo nome studio, toggle white-label).
- All'avvio di `Settings.tsx` invocare `refreshUser()` per partire sempre dai dati freschi del DB.

---

## 3. Permessi rigorosi (admin-only operations)

**Migration RLS su `app_users`**
- Sostituire la policy permissiva attuale (`Allow all access … using:true check:true`) con:
  - `SELECT`: ogni utente può leggere solo la riga con `id = current_setting('request.headers')::json->>'x-iusta-user-id'`. Admin (verificato via funzione `public.is_iusta_admin(uuid)` `SECURITY DEFINER`) può leggere tutto.
  - `INSERT` / `DELETE`: solo se `public.is_iusta_admin(<header user id>)` è true.
  - `UPDATE`: cliente può aggiornare solo la propria riga e solo i campi non sensibili (`studio`, `logo_url`); admin può aggiornare tutto.
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO anon, authenticated; GRANT ALL TO service_role;` (necessario perché il client non passa per `auth.users`).
- Funzione `public.is_iusta_admin(_id uuid)` security-definer che ritorna `true` se quella riga ha `is_admin=true`.

**Client — header automatico**
- In `src/integrations/supabase/client.ts` **non si può modificare** (auto-gen). Soluzione: nuovo helper `src/lib/supa.ts` che esporta `withUser(supabase)` aggiungendo l'header `x-iusta-user-id` via `supabase.rest.headers` su ogni richiesta dopo il login (impostato in `AuthContext` quando l'utente entra; rimosso al logout).
- In alternativa più semplice e robusta: spostare le operazioni admin-only (`insertUser`, `deleteUser`, `toggleAuth`, `updateClient`) dietro a 4 nuove edge function (`admin-create-user`, `admin-delete-user`, `admin-update-user`, `admin-toggle-auth`) che ricevono `{adminId, adminPasswordHash}` e verificano contro `app_users` prima di eseguire con `service_role`. Le RLS bloccano qualunque tentativo dal client.

> **Approccio scelto: edge functions admin-only + RLS strette.** È l'unica soluzione realmente sicura senza Supabase Auth.

**Refactor frontend**
- `Clienti.tsx`: sostituire le chiamate `supabase.from("app_users").insert/delete/update` con `supabase.functions.invoke("admin-*", { body: { adminId, adminPasswordHash, ... } })`.
- `Settings.tsx`: l'update studio/logo del proprio profilo passa per una nuova `self-update-user` (riceve `userId + passwordHash` come prova di identità, aggiorna solo la propria riga).
- `AuthContext.login`: passare a edge function `auth-login` che ritorna i dati pubblici dell'utente, senza esporre `password_hash` al client (rimuovere uso diretto di `select * from app_users`).

---

## 4. Fix pulsante Condividi e modale centrata

**Diagnosi**
- `ShareDialog` viene renderizzato **due volte** in `ReportView.tsx` (header + floating bar). Avere due `Dialog` indipendenti con lo stesso stato interno non crea conflitti, ma il `DialogTrigger asChild` con un bottone custom dentro la floating bar (z-index alto, `pointer-events`) può intercettare male il click.

**Fix**
- Convertire `ShareDialog` in componente **controllato** (`open` / `onOpenChange` come prop opzionali) con un metodo `openShareDialog(caseId)` esposto via un context leggero (`ShareContext`) montato in `ReportView`. Header e floating bar invocano lo stesso dialog singleton centrato.
- `DialogContent`: forzare `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]` e `max-h-[90vh] overflow-y-auto`.
- Verifica click: rimuovere eventuali `e.stopPropagation()` nei wrapper della floating bar.

---

## 5. Modale "Nuovo cliente" centrata

**`Clienti.tsx`**
- Aggiungere a `DialogContent` le classi: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[85vh] overflow-y-auto sm:max-w-md`.
- Rimuovere qualsiasi `mt-*` ereditato dal contenitore padre. (Il problema attuale è che il dialog eredita stile `top-[50%]` ma il body ha scroll → appare in basso quando la pagina è scrollata. Forzando `fixed` centra rispetto al viewport.)
- Applicare lo stesso fix alla modale "Modifica cliente" (nuova) e a `AlertDialog` di eliminazione.

---

## File toccati

**Nuovi**
- `supabase/migrations/<ts>_app_users_rls_strict.sql` (RLS + `is_iusta_admin`)
- `supabase/functions/admin-create-user/index.ts`
- `supabase/functions/admin-delete-user/index.ts`
- `supabase/functions/admin-update-user/index.ts`
- `supabase/functions/admin-toggle-auth/index.ts`
- `supabase/functions/auth-login/index.ts`
- `supabase/functions/self-update-user/index.ts`
- `src/components/EditClientDialog.tsx`
- `src/contexts/ShareContext.tsx`

**Modificati**
- `src/components/DownloadDialog.tsx` (white-label su DOCX/ZIP)
- `src/components/ShareDialog.tsx` (controllato, centratura forzata)
- `src/components/ReportView.tsx` (ShareContext, singleton dialog)
- `src/pages/Clienti.tsx` (edge functions, realtime, dialog centrato, edit dialog)
- `src/pages/Settings.tsx` (realtime su propria riga, self-update via function)
- `src/contexts/AuthContext.tsx` (login via edge function, niente password_hash nel client)
- `supabase/functions/generate-docx/index.ts` (header studio + logo)
- `supabase/functions/generate-fascicolo/index.ts` (forward white-label + naming)

## Out of scope
- Reset password / cambio username
- Migrazione a Supabase Auth reale (richiederebbe rewrite)
- Cambio password dall'interfaccia (può essere aggiunto in un secondo step)
