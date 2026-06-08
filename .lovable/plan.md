# Piano di implementazione

## 1. Autenticazione multi-utente + Admin

**Database (nuova tabella `app_users`)**
- `id uuid PK`, `username text UNIQUE`, `password_hash text`, `studio text`, `pagano numeric`, `logo_url text`, `is_admin bool`, `is_authorized bool` (toggle white-label), `created_at`.
- Seed: `pado` / `ADMIN` con `is_admin = true`, `is_authorized = true`.
- RLS aperta (validazione lato edge function); GRANT a `anon`/`authenticated`/`service_role`.

**Edge functions**
- `auth-login`: riceve `{username, password}`, verifica hash, restituisce profilo utente (no JWT custom — manteniamo session client-side firmata).
- `auth-create-user` (solo admin): crea cliente con `studio`, `pagano`, `username`, `password`.
- `auth-delete-user` (solo admin): elimina cliente.
- `auth-toggle-authorization` (solo admin): flip `is_authorized`.
- `auth-update-profile`: utente aggiorna proprio `studio` e `logo_url`.

**Frontend**
- `AuthContext` riscritto: chiama `auth-login`, salva profilo in `localStorage` con scadenza **24h** (timestamp `expiresAt`). Toggle "Ricordami" controlla se la sessione persiste o si svuota a chiusura tab (`sessionStorage` vs `localStorage`).
- Pulsante **Logout** nella sidebar (in basso, vicino al nome utente) con conferma.
- `RequireAuth` legge expiry e forza redirect a `/login` se scaduta.

## 2. Pagina "Clienti" (solo admin)

- Route `/clienti` mostrata in `AppSidebar` solo se `user.is_admin`.
- Layout: titolo "Clienti", bottone in alto a destra **"+ Nuovo cliente"** (apre Dialog con form: Studio, Pagano €, Username, Password).
- Griglia di card stile screenshot allegato (liquid glass coerente col resto): icona, nome **Studio**, badge "active/inactive", riga "Pagano: €X/mese", username, **Toggle "White-Label autorizzato"**, icona **bidone rosso** in alto a destra per eliminare (con conferma).
- Card si aggiorna in realtime quando admin/utente cambia studio o logo.

## 3. Landing/Login ridisegnata

- `/login` diventa landing pubblica liquid glass: hero "IUSTA — Legal Intelligence per studi infortunistica", 3 sezioni brevi (Analisi AI / Report Professionali / Sicurezza), CTA "Accedi alla piattaforma" che apre la pearl glass card di login esistente in modale o sotto la fold.
- Niente registrazione, frase "Piattaforma esclusiva — accesso solo su invito".
- Mantenuto il design pearl/gold attuale, aggiunto contenuto editoriale.

## 4. Share Dialog (fix)

- Problema attuale: il menu/modale non appare. Rivedo `ShareDialog.tsx` → uso un `Dialog` Radix centrato (`fixed inset-0` overlay + content centrato) invece dell'attuale popover/dropdown. Verifico che il trigger nella Floating Action Bar di `ReportView` apra realmente lo stato `open`.
- Stile liquid glass al centro pagina, copia link con feedback "Copiato!".

## 5. Modelli → PDF "Istanza accesso atti"

- Template `accesso-atti` produce markdown strutturato come il modulo nella foto (campi: Sottoscritto, Codice fiscale, Nato il, Residenza, Tel, Email, In qualità di, Documenti richiesti, Motivazione, Tramite, Allega, Data, Firma) con header destinatario.
- Edge function `generate-pdf` estesa: se template = `accesso-atti`, genera PDF A4 con layout modulo (linee di compilazione, intestazione box in alto a destra), usando `pdf-lib` o `reportlab` (Deno: `pdf-lib`). I dati mancanti vengono pre-compilati dall'AI usando il caso selezionato + nome studio dell'utente loggato (passato come `studioName` nel body).
- Aggiungo bottone "Scarica PDF" nella view documento generato in `Modelli.tsx` che chiama `generate-pdf` con `template: "accesso-atti"`.

## 6. White-Label Report

- In `Impostazioni` (rinominato da "Settings"): utente vede campi **Nome Studio** e **Logo** (upload su Storage bucket `case-files/logos/{userId}.png` → URL salvato in `app_users.logo_url`). Visibile solo se `is_authorized = true`, altrimenti mostro card "Funzione white-label non attiva — contatta l'amministratore".
- `generate-pdf` legge `logo_url` + `studio` dell'utente loggato:
  - se `is_authorized` → sostituisce header IUSTA col logo cliente
  - altrimenti → mantiene branding IUSTA
- Admin nella pagina Clienti vede il logo aggiornato (poll su mount + refetch dopo toggle).

## 7. Rinomina Settings → Impostazioni

- `AppSidebar.tsx`, `Settings.tsx` (route resta `/settings` per non rompere link), label e h1 → "Impostazioni".

---

## File principali

**Nuovi**
- `supabase/migrations/<ts>_app_users.sql`
- `supabase/functions/auth-login/index.ts`
- `supabase/functions/auth-create-user/index.ts`
- `supabase/functions/auth-delete-user/index.ts`
- `supabase/functions/auth-toggle-authorization/index.ts`
- `supabase/functions/auth-update-profile/index.ts`
- `src/pages/Clienti.tsx`
- `src/components/ClientCard.tsx`
- `src/components/NewClientDialog.tsx`
- `src/pages/Landing.tsx` (nuova homepage pubblica, sostituisce route `/login` o `/`)

**Modificati**
- `src/contexts/AuthContext.tsx` (multi-user, 24h expiry, remember-me)
- `src/components/RequireAuth.tsx` (admin check helper)
- `src/App.tsx` (route `/clienti` gated, landing pubblica)
- `src/components/AppSidebar.tsx` (logout, link Clienti per admin, rename Impostazioni)
- `src/components/ShareDialog.tsx` (Dialog centrato funzionante)
- `src/components/ReportView.tsx` (verifica trigger share)
- `src/pages/Settings.tsx` (rename + sezione white-label)
- `src/pages/Modelli.tsx` (bottone scarica PDF)
- `src/lib/templates.ts` (template "accesso-atti" strutturato)
- `supabase/functions/generate-pdf/index.ts` (layout modulo + white-label)

## Note tecniche

- Le password vengono hashate con `bcrypt` (Deno `https://deno.land/x/bcrypt`) lato edge.
- Sessione client: oggetto `{ user, expiresAt }` salvato in `localStorage`/`sessionStorage` con chiave `iusta_session`. Niente JWT custom: gli edge function admin-only verificano `x-iusta-user` header contro DB.
- Bucket `case-files` esistente riusato per i loghi sotto prefix `logos/`.

## Fuori scopo
- Vera auth Supabase (`auth.users`): l'utente vuole sistema custom semplice basato su `username`. Manteniamo così.
- Reset password / recupero: non richiesto.