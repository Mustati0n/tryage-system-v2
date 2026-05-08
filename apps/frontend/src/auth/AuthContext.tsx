import { createContext, useContext, useMemo, useState } from "react";
import { api, clearAuthTokens, setAuthTokens } from "../api/client";
import type { LoginResponse, Role } from "./types";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  login: (kullaniciAdi: string, sifre: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const r = localStorage.getItem("role");
    return r === "ADMIN" || r === "PERSONEL" ? r : null;
  });

  const login = async (kullaniciAdi: string, sifre: string) => {
    const { data } = await api.post<LoginResponse>("/api/auth/login", { kullaniciAdi, sifre });
    setAuthTokens(data.accessToken, data.refreshToken);
    localStorage.setItem("role", data.rol);
    localStorage.setItem("username", kullaniciAdi.trim());
    localStorage.setItem("lastLoginAt", new Date().toISOString());
    setRole(data.rol);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      clearAuthTokens();
      setRole(null);
    }
  };

  const value = useMemo(
    () => ({ isAuthenticated: !!role, role, login, logout }),
    [role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth AuthProvider icinde kullanilmali");
  }
  return ctx;
}
