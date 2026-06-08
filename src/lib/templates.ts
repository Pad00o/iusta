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
    description: "Istanza di accesso atti a Polizia Municipale o Comune (modulo L.241/1990)",
    icon: "🏛️",
    prompt: `Genera un MODULO DI ISTANZA DI ACCESSO AGLI ATTI AMMINISTRATIVI ai sensi della L. 241/1990, basato sul caso fornito e formattato esattamente con questo schema markdown (non aggiungere altro):

# MODULO RICHIESTA DI ACCESSO AGLI ATTI AMMINISTRATIVI
*(Legge 07/08/1990 n. 241 e successive modifiche ed integrazioni)*

**Destinatario:** [Comando di Polizia Locale / Comune competente in base al luogo del sinistro]

---

## DATI DEL RICHIEDENTE

- **Il / La sottoscritto/a:** [Nome e Cognome]
- **Codice fiscale:** [Codice fiscale]
- **Nato/a il:** [Data di nascita] **a:** [Luogo di nascita] **prov.:** [Provincia] **stato:** Italia
- **Residente a:** [Comune di residenza] **Via:** [Indirizzo]
- **n.:** [Numero civico] **Tel.:** [Telefono] **fax:** —
- **e-mail:** [Email del richiedente]

## IN QUALITÀ DI

☑ **Legale rappresentante di:** [Nome dello studio legale che presenta l'istanza] in nome e per conto di [Nome del cliente assistito]

## CHIEDE

☑ Il rilascio di copia autenticata dei seguenti documenti amministrativi:

- Verbale completo di accertamento del sinistro stradale avvenuto in data **[Data del sinistro]** in **[Luogo del sinistro]**
- Rilievi planimetrici e fotografici
- Eventuali dichiarazioni rese dalle parti e dai testimoni
- Eventuali registrazioni audio/video e referti del 118 acquisiti

## MOTIVAZIONE

Tutela degli interessi giuridici del proprio assistito, **[Nome del cliente]**, parte coinvolta nel sinistro suindicato, ai fini dell'esercizio del diritto al risarcimento dei danni patiti, nonché per la predisposizione degli atti giudiziali e stragiudiziali necessari alla tutela della posizione giuridica del medesimo.

## MODALITÀ DI TRASMISSIONE

Chiede, se possibile, che la documentazione richiesta sia trasmessa tramite:

☑ **e-mail** all'indirizzo PEC dello studio: [PEC dello studio]

## ALLEGA

- Copia del documento d'identità del sottoscritto
- Procura del cliente assistito
- Eventuali documenti utili alla valutazione dell'istanza

Si impegna a corrispondere l'importo relativo ai costi di riproduzione, se dovuti.

---

**Data:** [data di oggi in formato gg/mm/aaaa]

**Firma:** _____________________________

REGOLE IMPORTANTI:
- Riempi i campi tra [parentesi] usando i dati REALI ricavati dal caso fornito.
- Il **Legale rappresentante di** deve essere il nome dello STUDIO che genera il documento (te lo passo tramite il contesto "Studio").
- Mantieni lo schema, le sezioni e i simboli di checkbox (☑) ESATTAMENTE come sopra.
- Non aggiungere conclusioni o testo extra fuori dallo schema.`,
  },
];
