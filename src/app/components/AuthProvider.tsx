"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authClient } from "../auth-client";

type User = { id: string; firstName: string; lastName: string; email: string; emailVerified: boolean; role: "ADMIN" | "USER" };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  signUp: async () => null,
  logout: async () => undefined,
});

function toUser(u: { id: string; name: string; email: string; [key: string]: unknown } | undefined | null): User | null {
  if (!u) return null;
  return {
    id: u.id,
    firstName: (u.firstName as string) || u.name.split(" ")[0] || "",
    lastName: (u.lastName as string) || u.name.split(" ").slice(1).join(" ") || "",
    email: u.email,
    emailVerified: (u.emailVerified as boolean) ?? false,
    role: ((u.role as string) === "ADMIN" ? "ADMIN" : "USER") as "ADMIN" | "USER",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession()
      .then(({ data }) => setUser(toUser(data?.user)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) return (error as { message?: string }).message ?? "Sisselogimine ebaõnnestus";
    setUser(toUser(data?.user));
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string): Promise<string | null> => {
    const name = `${firstName} ${lastName}`.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (authClient.signUp as any).email({ email, password, name, firstName, lastName });
    if (error) return (error as { message?: string }).message ?? "Registreerimine ebaõnnestus";
    setUser(toUser(data?.user));
    return null;
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
