// app/context/AuthContext.jsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gmail_token");
  });

  const clearSession = useCallback(() => {
    setToken(null);
    localStorage.removeItem("gmail_token");
    sessionStorage.removeItem("pin_verified");
  }, []);

  const login = useCallback(() => {
    if (!window.google) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope:
        "https://www.googleapis.com/auth/gmail.readonly openid email profile",
      ux_mode: "popup",
      callback: (res) => {
        if (res?.error) {
          console.error("Google OAuth error:", res);
          return;
        }

        if (res?.access_token) {
          setToken(res.access_token);
          localStorage.setItem("gmail_token", res.access_token); // Save session
        }
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  }, []);

  const logout = useCallback(() => {
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token);
    }
    clearSession();
  }, [clearSession, token]);

  return (
    <AuthContext.Provider value={{ token, login, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
