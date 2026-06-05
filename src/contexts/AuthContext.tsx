import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "iusta_auth_user";
const VALID_USER = "pado";
const VALID_PASS = "ADMIN";

interface AuthContextValue {
  user: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(stored);
    } catch {}
  }, []);

  const login = (username: string, password: string) => {
    if (username.trim().toLowerCase() === VALID_USER && password === VALID_PASS) {
      localStorage.setItem(STORAGE_KEY, VALID_USER);
      setUser(VALID_USER);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
