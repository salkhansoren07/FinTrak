// app/context/AuthContext.jsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gmail_token");
  });

  const clearSession = useCallback(() => {
    setToken(null);
    setAuthError(null);
    localStorage.removeItem("gmail_token");
    sessionStorage.removeItem("pin_verified");
  }, []);

  const login = useCallback(() => {
    if (!window.google) return;
    setAuthError(null);

    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || window.location.origin;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope:
        "https://www.googleapis.com/auth/gmail.readonly openid email profile",
      ux_mode: "popup",
      redirect_uri: redirectUri,
      callback: (res) => {
        if (res?.error) {
          console.error("Google OAuth error:", res);
          if (res.error === "redirect_uri_mismatch") {
            setAuthError(
              "Google sign-in is blocked: redirect URI mismatch. Add this URI in Google Cloud Console > OAuth client > Authorized redirect URIs: " +
                redirectUri
            );
            return;
          }
          setAuthError("Google sign-in failed. Please try again.");
          return;
        }

        if (res?.access_token) {
          setToken(res.access_token);
          setAuthError(null);
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
    <AuthContext.Provider
      value={{ token, login, logout, clearSession, authError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
