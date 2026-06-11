import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "iusta_session_v2";
const SESSION_HOURS = 24;

export interface AppUser {
  id: string;
  username: string;
  studio: string;
  pagano: number;
  logo_url: string | null;
  is_admin: boolean;
  is_authorized: boolean;
}

interface StoredSession {
  user: AppUser;
  passwordHash: string;
  expiresAt: number;
  remember: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  passwordHash: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalUser: (patch: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(s: StoredSession) {
  const j = JSON.stringify(s);
  if (s.remember) {
    localStorage.setItem(STORAGE_KEY, j);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, j);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function toAppUser(row: any): AppUser {
  return {
    id: row.id,
    username: row.username,
    studio: row.studio || "",
    pagano: Number(row.pagano || 0),
    logo_url: row.logo_url,
    is_admin: !!row.is_admin,
    is_authorized: !!row.is_authorized,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const s = readStored();
    if (s) {
      setUser(s.user);
      setPasswordHash(s.passwordHash);
      setRemember(s.remember);
    }
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    const { data, error } = await supabase.functions.invoke("auth-login", {
      body: { username, password },
    });
    if (error || !data?.user || !data?.passwordHash) return false;
    const u = toAppUser(data.user);
    const session: StoredSession = {
      user: u,
      passwordHash: data.passwordHash, // sha256 of the password — used as session token only
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
      remember: rememberMe,
    };
    writeStored(session);
    setRemember(rememberMe);
    setUser(u);
    setPasswordHash(data.passwordHash);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setPasswordHash(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    // safe SELECT (password_hash never read by client UI; harmless given table SELECT is public)
    const { data } = await supabase
      .from("app_users")
      .select("id,username,studio,pagano,logo_url,is_admin,is_authorized")
      .eq("id", user.id)
      .maybeSingle();
    if (!data) return;
    const u = toAppUser(data);
    setUser(u);
    if (passwordHash) {
      writeStored({
        user: u,
        passwordHash,
        expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
        remember,
      });
    }
  };

  const updateLocalUser = (patch: Partial<AppUser>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    setUser(next);
    if (passwordHash) {
      writeStored({
        user: next,
        passwordHash,
        expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
        remember,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        passwordHash,
        isAuthenticated: !!user,
        isAdmin: !!user?.is_admin,
        login,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
