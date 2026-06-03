import { ShieldCheck, EyeOff, Lock, Server, Download, FileBadge } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";

const pillars = [
  {
    icon: ShieldCheck,
    title: "GDPR Compliance",
    subtitle: "Server in Unione Europea",
    body: "Tutti i dati sono trattati e conservati su infrastrutture localizzate esclusivamente in UE, in piena conformità al Regolamento (UE) 2016/679 (GDPR).",
  },
  {
    icon: EyeOff,
    title: "Zero-Data Retention",
    subtitle: "I tuoi dati restano tuoi",
    body: "IUSTA non utilizza i documenti caricati per addestrare modelli di IA pubblici. Nessuna informazione del fascicolo entra in dataset di terze parti.",
  },
  {
    icon: Lock,
    title: "Crittografia AES-256",
    subtitle: "Standard bancario",
    body: "I file sono protetti con crittografia di livello militare sia durante il trasferimento (TLS 1.3) sia a riposo sui server (AES-256).",
  },
  {
    icon: Server,
    title: "Accesso Protetto",
    subtitle: "Nessun accesso non autorizzato",
    body: "L'autenticazione è sicura e segregata: nemmeno lo staff di IUSTA può accedere ai contenuti dei fascicoli senza autorizzazione esplicita del titolare.",
  },
];

export default function Privacy() {
  const downloadCertificate = () => {
    toast.success("Certificato di Compliance", {
      description: "Il documento sarà disponibile a breve nella tua area riservata.",
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5 text-[10px] uppercase tracking-[0.3em] text-primary">
            <ShieldCheck className="h-3 w-3" /> Trust Center
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4 gold-text">
            La tua riservatezza è il nostro asset più prezioso
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia bancaria applicata al Legal Tech. Ogni fascicolo è protetto da
            standard di sicurezza ai livelli più alti del settore finanziario.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {pillars.map((p) => (
            <GlassCard key={p.title} interactive glow="gold" className="p-7 hover:-translate-y-0.5">
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))",
                    border: "1px solid rgba(212,175,55,0.4)",
                    boxShadow: "0 0 16px rgba(212,175,55,0.35)",
                  }}
                >
                  <p.icon className="h-6 w-6" style={{ color: "#D4AF37", filter: "drop-shadow(0 0 6px rgba(212,175,55,0.6))" }} />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-0.5">{p.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-primary/80 mb-2">{p.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Statement */}
        <GlassCard className="p-8 md:p-10 mb-10 text-center">
          <blockquote className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed italic">
            «Analisi protetta da segreto professionale: l'IA agisce come un assistente cieco
            che elabora e dimentica.»
          </blockquote>
        </GlassCard>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={downloadCertificate}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl liquid-action text-sm font-semibold"
          >
            <FileBadge className="h-4 w-4 text-primary" />
            Scarica il Certificato di Compliance
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Documento riservato · disponibile per i partner certificati IUSTA
          </p>
        </div>
      </div>
    </div>
  );
}
