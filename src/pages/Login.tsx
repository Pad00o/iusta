import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scale, User, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/"), 600);
  };

  return (
    <div className="login-pearl-bg relative min-h-screen w-full flex items-center justify-center overflow-hidden p-6">
      {/* Decorative pearls */}
      <div className="pearl pearl-1" />
      <div className="pearl pearl-2" />
      <div className="pearl pearl-3" />
      <div className="pearl pearl-4" />
      <div className="pearl pearl-5" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-gold-glow"
               style={{ background: "linear-gradient(135deg,#F4D88A 0%,#D4AF37 50%,#A6831F 100%)" }}>
            <Scale className="h-7 w-7 text-[#1a1408]" />
          </div>
          <h1 className="font-serif text-3xl tracking-tight"
              style={{ background: "linear-gradient(135deg,#F4D88A,#A6831F)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            IUSTA
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 mt-1">Legal Intelligence</p>
        </div>

        {/* Master glass card */}
        <div className="pearl-card rounded-[32px] p-8">
          <h2 className="font-serif text-xl text-white text-center mb-1">Bentornato</h2>
          <p className="text-xs text-white/60 text-center mb-6">Accedi al tuo studio digitale</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                type="email"
                required
                placeholder="Email o username"
                className="pearl-input pl-11 h-12 rounded-full"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                type="password"
                required
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
                <span>Ricordami</span>
              </label>
              <a href="#" className="hover:text-white transition-colors">Password dimenticata?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-bold tracking-[0.2em] text-sm uppercase transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg,#FFFFFF 0%,#F4D88A 50%,#D4AF37 100%)",
                color: "#1a1408",
                boxShadow: "0 10px 30px -10px rgba(212,175,55,0.6), inset 0 1px 1px rgba(255,255,255,0.6)",
              }}
            >
              {loading ? "Accesso..." : "Login"}
            </button>
          </form>

          <p className="text-[11px] text-white/60 text-center mt-6 leading-relaxed">
            Accesso riservato ai partner certificati IUSTA
          </p>
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[11px] text-white/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Connessione criptata · </span>
          <Link to="/privacy" className="underline hover:text-white">Sicurezza e Privacy</Link>
        </div>
      </div>
    </div>
  );
}
