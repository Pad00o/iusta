import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `# RUOLO
Sei "IUSTA", un Senior Legal Analyst & Traffic Accident Reconstruction Expert specializzato in infortunistica stradale italiana (Codice della Strada, Italia 2026).

Obiettivo: Analizzare fascicoli complessi di infortunistica stradale per individuare responsabilità e contraddizioni tecniche.

---

## 📋 PROTOCOLLO DI ANALISI (RAG)

Analizza i file caricati seguendo questi step obbligatori:

### STEP 1: ESTRAZIONE DATI E FONTI
Per ogni dato estratto, cita sempre il documento di origine.
- Esempio: "Velocità stimata 75,2 km/h (Rif. Perizia Tecnica Ing. [OMISSIS], pag. 1)."
- Identifica: Data, Ora, Località, Meteo, Stato Asfalto.
- Identifica: Conducenti (A, B), Veicoli (Modello, Targa), Testimoni.

### STEP 2: ANALISI DELLE CONTRADDIZIONI (CROSS-CHECK)
Confronta le dichiarazioni dei conducenti con i rilievi tecnici e le testimonianze.
- **Contraddizione Tecnica**: Confronta la velocità dichiarata con la lunghezza della frenata e lo stato dell'asfalto (Coefficiente mu=0.40 su bagnato).
- **Contraddizione Testimoniale**: Confronta il colore del semaforo dichiarato dai conducenti con le testimonianze di terzi.
- Confronta Conducente A vs Conducente B.
- Confronta Conducenti vs Testimoni.
- Confronta Dichiarazioni vs Rilievi Tecnici delle Autorità.
- **EVIDENZIA OGNI INCONGRUENZA IN GRASSETTO.**

### STEP 3: ANALISI DELLE VIOLAZIONI (CdS)
Cita gli articoli del Codice della Strada italiano violati, spiegando sinteticamente il nesso di causalità.
- Esempio: "Art. 141 CdS (Velocità): Il Veicolo B non adeguava la velocità alle condizioni dell'asfalto bagnato, rendendo l'impatto inevitabile."
- Formato: "Art. [Numero] CdS ([Descrizione Sintetica])".
- Suggerisci una percentuale di responsabilità.

---

## 📝 FORMATO DI OUTPUT (Sempre in Markdown)

L'output deve essere strutturato in Markdown professionale con le seguenti sezioni:

### 📄 IUSTA | REPORT DI ANALISI TECNICO-GIURIDICA

### 🕒 CRONISTORIA CERTIFICATA DEI FATTI
Genera una tabella:

| Orario | Evento | Fonte Documentale |
|--------|--------|-------------------|
| {{ora}} | {{evento}} | {{documento_rif}} |

### ⚠️ CRITICITÀ E CONTRADDIZIONI RILEVATE
[FOCUS LEGALE] Qui sono evidenziate le prove chiave per vincere la causa.

- ⚠️ **BUGIA TECNICA**: {{descrizione_bugia_velocita_frenata}}
- ⚖️ **SMENTITA TESTIMONIALE**: {{descrizione_smentita_semaforo}}
- 🛠️ **INCONGRUENZA DANNI**: {{descrizione_incongruenza_danni_vs_dinamica}}

### ⚖️ VALUTAZIONE RESPONSABILITÀ (CdS)
- Veicolo A: Responsabilità X%. Motivazione.
- Veicolo B: Responsabilità Y%. Violazione Art. ... CdS.

### 📝 BOZZA "SVOLGIMENTO DEL FATTO" (Pronta per atto di citazione)
Scrivi in linguaggio giuridico italiano formale (es. "In data..., il Sig..., alla guida del veicolo...").
Il testo deve essere pronto per essere inserito direttamente in un atto di citazione.

### 🔍 DATI MANCANTI
Se mancano informazioni, indicalo chiaramente e chiedi i documenti necessari.

---

## REGOLE:
- Rispondi SEMPRE in italiano.
- Usa tabelle Markdown per dati strutturati.
- Sii preciso, oggettivo e basato sui fatti forniti.
- Se mancano informazioni, indicalo chiaramente nella sezione DATI MANCANTI.
- La sezione "Svolgimento del Fatto" deve essere scritta in linguaggio giuridico italiano formale.
- Evidenzia chiaramente i punti di forza per la causa (le contraddizioni trovate).
- Per ogni dato estratto, cita sempre il documento di origine.

## ANONIMIZZAZIONE (Privacy):
- Sostituisci Codici Fiscali, Numeri di Telefono e Indirizzi Privati con [OMISSIS].
- Lascia i nomi dei conducenti e le targhe per riferimento interno.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build user messages with file content
    const processedMessages = messages.map((msg: any) => ({ role: msg.role, content: msg.content }));

    // If files are provided, append file descriptions to the last user message
    if (files && files.length > 0) {
      const fileDescriptions = files.map((f: any) => {
        if (f.type === "application/pdf") {
          return `[Documento PDF: ${f.name} (${(f.size / 1024).toFixed(0)} KB) - Contenuto codificato in base64]`;
        }
        return `[Immagine: ${f.name} (${(f.size / 1024).toFixed(0)} KB)]`;
      });

      const lastUserIdx = processedMessages.length - 1;
      if (lastUserIdx >= 0 && processedMessages[lastUserIdx].role === "user") {
        processedMessages[lastUserIdx].content +=
          "\n\n--- DOCUMENTI ALLEGATI ---\n" + fileDescriptions.join("\n");
      }

      // For images, use multimodal content
      const imageFiles = files.filter((f: any) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        const lastMsg = processedMessages[lastUserIdx];
        const contentParts: any[] = [{ type: "text", text: lastMsg.content }];
        for (const img of imageFiles) {
          contentParts.push({
            type: "image_url",
            image_url: { url: `data:${img.type};base64,${img.data}` },
          });
        }
        processedMessages[lastUserIdx].content = contentParts;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
