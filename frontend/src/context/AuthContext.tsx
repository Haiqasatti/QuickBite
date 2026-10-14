import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, setUnauthorizedHandler, tokenStore } from "../lib/api";
import { authApi } from "../lib/endpoints";
import type { LoginInput, RegisterInput, User } from "../types";
import { useToast } from "./ToastContext";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStore.get() !== null);

  // Any 401 from an authenticated call (expired/invalid token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (tokenStore.get() === null) return;
      tokenStore.clear();
      setUser(null);
      notify("Your session has expired. Please sign in again.", "info");
    });
    return () => setUnauthorizedHandler(null);
  }, [notify]);

  // Restore the session after a refresh.
  useEffect(() => {
    if (tokenStore.get() === null) return;
    let cancelled = false;
    authApi
      .me()
      .then(({ user: current }) => {
        if (!cancelled) setUser(current);
      })
      .catch((error: unknown) => {
        // A 401 is handled by the unauthorized handler. Other failures (e.g. server down)
        // leave the token in place so a later refresh can recover.
        if (!(error instanceof ApiError)) return;
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authApi.login(input);
    tokenStore.set(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input);
    tokenStore.set(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAdmin: user?.role === "ADMIN", login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}