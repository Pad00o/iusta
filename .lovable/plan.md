

## LegalAgent v1.0 — Agente IA per Infortunistica Stradale

### Panoramica
App web con interfaccia chat dove gli avvocati caricano documenti (PDF, immagini) relativi a sinistri stradali e ricevono un report strutturato con analisi legale completa. Accesso libero, senza login.

### Pagine e Layout

**Pagina principale — Chat + Upload**
- Header con logo "LegalAgent v1.0" e sottotitolo "Analisi Infortunistica Stradale"
- Area di upload file drag & drop (PDF, JPG, PNG) con preview dei file caricati
- Chat con l'agente AI: l'utente carica i documenti, l'agente analizza e genera il report strutturato
- Risposte in streaming con Markdown renderizzato (tabelle, grassetto, sezioni con emoji)
- Pulsanti "Copia testo" e "Scarica PDF" su ogni risposta dell'agente

### Funzionalità Core

1. **Upload documenti multipli** — drag & drop o click, supporto PDF/JPG/PNG, preview con nome file e dimensione
2. **Chat con AI** — invio messaggi + file allegati, risposte in streaming con rendering Markdown
3. **Prompt di sistema legale** — il workflow completo (estrazione dati, cronistoria, audit tecnico, cross-check, sintesi giuridica, anonimizzazione) come system prompt nell'edge function
4. **Export report** — bottone per copiare il testo Markdown e bottone per generare/scaricare PDF formattato
5. **Nuova analisi** — bottone per resettare la chat e iniziare un nuovo caso

### Backend (Lovable Cloud)

- Edge function `chat` che riceve messaggi + file codificati, chiama Lovable AI Gateway con il system prompt legale, restituisce streaming SSE
- Edge function `generate-pdf` che riceve il Markdown del report e genera un PDF formattato scaricabile

### Design
- Tema chiaro professionale, palette sobria (blu scuro/grigio)
- Font leggibile, layout pulito stile "tool per professionisti"
- Responsive per uso anche su tablet

