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
  expiresAt: number;
  remember: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
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
    const raw =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
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

function writeStored(session: StoredSession) {
  const json = JSON.stringify(session);
  if (session.remember) {
    localStorage.setItem(STORAGE_KEY, json);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, json);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const s = readStored();
    if (s) {
      setUser(s.user);
      setRemember(s.remember);
    }
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .ilike("username", username.trim())
      .maybeSingle();

    if (error || !data) return false;
    if (data.password_hash !== password) return false;

    const u: AppUser = {
      id: data.id,
      username: data.username,
      studio: data.studio || "",
      pagano: Number(data.pagano || 0),
      logo_url: data.logo_url,
      is_admin: !!data.is_admin,
      is_authorized: !!data.is_authorized,
    };
    const session: StoredSession = {
      user: u,
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
      remember: rememberMe,
    };
    writeStored(session);
    setRemember(rememberMe);
    setUser(u);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!data) return;
    const u: AppUser = {
      id: data.id,
      username: data.username,
      studio: data.studio || "",
      pagano: Number(data.pagano || 0),
      logo_url: data.logo_url,
      is_admin: !!data.is_admin,
      is_authorized: !!data.is_authorized,
    };
    setUser(u);
    writeStored({
      user: u,
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
      remember,
    });
  };

  const updateLocalUser = (patch: Partial<AppUser>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    setUser(next);
    writeStored({
      user: next,
      expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
      remember,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
