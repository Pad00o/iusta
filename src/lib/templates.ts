export interface LegalTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export const legalTemplates: LegalTemplate[] = [
  {
    id: "atto-citazione",
    name: "Atto di citazione",
    description: "Atto di citazione per causa di infortunistica stradale",
    icon: "⚖️",
    prompt: `Genera un ATTO DI CITAZIONE per infortunistica stradale basandoti sui dati del caso fornito. 
Usa il formato legale italiano formale. Includi: intestazione del tribunale competente, parti in causa, 
fatto (basato sull'analisi del sinistro), diritto (articoli CdS violati, art. 2054 c.c., danno biologico), 
conclusioni e domande. Usa i dati reali del caso.`,
  },
  {
    id: "comparsa-risposta",
    name: "Comparsa di costituzione e risposta",
    description: "Comparsa di costituzione e risposta in giudizio",
    icon: "📄",
    prompt: `Genera una COMPARSA DI COSTITUZIONE E RISPOSTA per il caso fornito. 
Formato legale italiano. Includi: intestazione tribunale, costituzione della parte convenuta, 
fatto (ricostruzione dal punto di vista del convenuto), diritto, eccezioni, conclusioni.`,
  },
  {
    id: "messa-in-mora",
    name: "Lettera di messa in mora assicurazione",
    description: "Lettera di messa in mora alla compagnia assicurativa",
    icon: "📬",
    prompt: `Genera una LETTERA DI MESSA IN MORA alla compagnia assicurativa per il caso fornito.
Includi: dati del sinistro, richiesta risarcimento con termine (15 giorni), riferimenti normativi 
(art. 148 CdA, art. 1219 c.c.), elenco danni, documenti allegati.`,
  },
  {
    id: "richiesta-risarcimento",
    name: "Richiesta risarcimento danni",
    description: "Richiesta formale di risarcimento danni da sinistro",
    icon: "💰",
    prompt: `Genera una RICHIESTA DI RISARCIMENTO DANNI formale per il caso fornito.
Includi: descrizione sinistro, quantificazione danni (patrimoniali e non patrimoniali), 
danno biologico, danno morale, spese mediche, lucro cessante, documenti probatori.`,
  },
  {
    id: "diffida",
    name: "Diffida",
    description: "Diffida stragiudiziale con intimazione ad adempiere",
    icon: "⚠️",
    prompt: `Genera una DIFFIDA STRAGIUDIZIALE per il caso fornito.
Formato legale formale. Includi: intimazione al pagamento, termine perentorio, 
avvertimento di azione legale, riferimenti normativi, riepilogo fatti e pretese.`,
  },
  {
    id: "transazione",
    name: "Transazione stragiudiziale",
    description: "Accordo transattivo stragiudiziale tra le parti",
    icon: "🤝",
    prompt: `Genera un ACCORDO DI TRANSAZIONE STRAGIUDIZIALE per il caso fornito.
Includi: premesse (fatti del sinistro), reciproche concessioni, importo transattivo, 
modalità di pagamento, rinuncia alle azioni, clausole finali, firme.`,
  },
  {
    id: "istanza-accesso-atti",
    name: "Istanza di accesso atti",
    description: "Istanza di accesso atti a Polizia Municipale o Comune",
    icon: "🏛️",
    prompt: `Genera un'ISTANZA DI ACCESSO AGLI ATTI per il caso fornito.
Destinataria: Polizia Municipale / Comando Vigili / Comune competente.
Includi: riferimenti L. 241/1990, dati del sinistro, documenti richiesti 
(verbale completo, planimetria, foto, eventuali registrazioni), motivazione, recapiti.`,
  },
];
