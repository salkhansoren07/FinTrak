"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearAllPinVerifications } from "../lib/clientSession";

const AuthContext = createContext();

async function fetchSession() {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load auth session");
  }
  return res.json();
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload?.error || "Authentication request failed");
  }

  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = await fetchSession();
      setUser(data?.authenticated ? data.user : null);
      setGmailConnected(Boolean(data?.gmailConnected));
      setHasPasscode(Boolean(data?.hasPasscode));
    } catch (error) {
      console.error("Failed to refresh auth session:", error);
      setUser(null);
      setGmailConnected(false);
      setHasPasscode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const connectGmail = useCallback((options = {}) => {
    const search = new URLSearchParams();
    const shouldForceConsent = options.forceConsent ?? true;
    if (shouldForceConsent) {
      search.set("consent", "1");
    }
    const suffix = search.toString() ? `?${search.toString()}` : "";
    window.location.assign(`/api/auth/google/start${suffix}`);
  }, []);

  const signup = useCallback(async ({ username, email, password }) => {
    const payload = await postJson("/api/auth/signup", {
      username,
      email,
      password,
    });

    setUser(payload.user || null);
    setGmailConnected(Boolean(payload.gmailConnected));
    setHasPasscode(Boolean(payload.hasPasscode));
    return payload;
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const payload = await postJson("/api/auth/login", {
      identifier,
      password,
    });

    setUser(payload.user || null);
    setGmailConnected(Boolean(payload.gmailConnected));
    setHasPasscode(Boolean(payload.hasPasscode));
    return payload;
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to clear auth session:", error);
    } finally {
      setUser(null);
      setGmailConnected(false);
      setHasPasscode(false);
      clearAllPinVerifications();
    }
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        gmailConnected,
        hasPasscode,
        loading,
        authenticated: Boolean(user),
        login,
        signup,
        connectGmail,
        logout,
        clearSession,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
