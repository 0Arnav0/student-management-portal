import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StaffUser, LoginInput } from "@student-portal/shared";
import { apiRequest } from "../lib/api.js";

interface AuthContextType {
  user: StaffUser | null;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<StaffUser>;
  logout: () => Promise<void>;
  isPrincipal: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Rehydrate session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await apiRequest<StaffUser>("/api/auth/me");
        setUser(currentUser);
      } catch (err) {
        // Ignored — user is just not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  async function login(credentials: LoginInput): Promise<StaffUser> {
    const loggedInUser = await apiRequest<StaffUser>("/api/auth/login", {
      method: "POST",
      json: credentials,
    });
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  const isPrincipal = user?.role === "PRINCIPAL";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isPrincipal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
