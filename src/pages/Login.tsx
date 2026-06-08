import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Scale,
  User,
  Lock,
  ShieldCheck,
  Sparkles,
  FileText,
  Brain,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const from = (location.state as any)?.from || "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(username, password, remember);
      if (ok) {
        toast.success("Accesso effettuato");
        navigate(from, { replace: true });
      } else {
        toast.error("Credenziali non valide", {
          description: "Verifica nome utente e password e riprova.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-pearl-bg relative min-h-screen w-full overflow-hidden">
      <div className="pearl pearl-1" />
      <div className="pearl pearl-2" />
      <div className="pearl pearl-3" />
      <div className="pearl pearl-4" />
      <div className="pearl pearl-5" />

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-gold-glow"
            style={{
              background:
                "linear-gradient(135deg,#F4D88A 0%,#D4AF37 50%,#A6831F 100%)",
            }}
          >
            <Scale className="h-5 w-5 text-[#1a1408]" />
          </div>
          <div>
            <div
              className="font-serif text-xl tracking-tight leading-none"
              style={{
                background: "linear-gradient(135deg,#F4D88A,#A6831F)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              IUSTA
            </div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/70 mt-0.5">
              Legal Intelligence
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="h-10 px-5 rounded-full text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg,#FFFFFF 0%,#F4D88A 50%,#D4AF37 100%)",
            color: "#1a1408",
            boxShadow:
              "0 6px 20px -6px rgba(212,175,55,0.6), inset 0 1px 1px rgba(255,255,255,0.6)",
          }}
        >
          Accedi
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-20 pb-16 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/30 backdrop-blur-xl text-[10px] uppercase tracking-[0.3em] text-white/80 mb-6">
            <Sparkles className="h-3 w-3" /> Piattaforma esclusiva su invito
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-white leading-[1.05] tracking-tight">
            Legal Intelligence per
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#F4D88A,#D4AF37,#A6831F)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              studi d'infortunistica
            </span>
          </h1>
          <p className="text-white/70 text-base md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            IUSTA analizza fascicoli di sinistri stradali con AI di nuova
            generazione: cronistorie, contraddizioni, violazioni del CdS e
            report professionali pronti per il deposito.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="h-12 px-8 rounded-full font-bold tracking-[0.2em] text-sm uppercase transition-all hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg,#FFFFFF 0%,#F4D88A 50%,#D4AF37 100%)",
                color: "#1a1408",
                boxShadow:
                  "0 10px 30px -10px rgba(212,175,55,0.6), inset 0 1px 1px rgba(255,255,255,0.6)",
              }}
            >
              Accedi alla piattaforma
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mt-20">
          {[
            {
              icon: Brain,
              title: "Analisi AI avanzata",
              desc: "Estrae cronistoria, contraddizioni e responsabilità da ogni documento del fascicolo.",
            },
            {
              icon: FileText,
              title: "Report professionali",
              desc: "PDF, Word e fascicoli ZIP brandizzati con il logo del tuo studio.",
            },
            {
              icon: ShieldCheck,
              title: "Sicurezza e privacy",
              desc: "Crittografia AES-256, zero-retention, accesso riservato.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="pearl-card rounded-2xl p-6 text-left"
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 bg-white/15 border border-white/30">
                <f.icon className="h-5 w-5 text-[#F4D88A]" />
              </div>
              <h3 className="font-serif text-lg text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/65 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-white/50 mt-16 tracking-wide">
          IUSTA è una piattaforma riservata ai partner certificati. La
          registrazione non è disponibile.
        </p>
      </main>

      {/* Login modal */}
      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/30 transition"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            <div className="pearl-card rounded-[32px] p-8">
              <h2 className="font-serif text-xl text-white text-center mb-1">
                Bentornato
              </h2>
              <p className="text-xs text-white/60 text-center mb-6">
                Accedi al tuo studio digitale
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome utente"
                    className="pearl-input pl-11 h-12 rounded-full"
                    autoComplete="username"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="pearl-input pl-11 h-12 rounded-full"
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white/80 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(c) => setRemember(c === true)}
                      className="liquid-check h-4 w-4"
                    />
                    <span>Ricordami 24h</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full font-bold tracking-[0.2em] text-sm uppercase transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  style={{
                    background:
                      "linear-gradient(135deg,#FFFFFF 0%,#F4D88A 50%,#D4AF37 100%)",
                    color: "#1a1408",
                    boxShadow:
                      "0 10px 30px -10px rgba(212,175,55,0.6), inset 0 1px 1px rgba(255,255,255,0.6)",
                  }}
                >
                  {loading ? "Accesso..." : "Login"}
                </button>
              </form>

              <p className="text-[11px] text-white/60 text-center mt-6 leading-relaxed">
                Accesso riservato ai partner certificati IUSTA
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
