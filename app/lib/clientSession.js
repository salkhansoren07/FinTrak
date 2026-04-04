"use client";

const PUBLIC_ROUTES = new Set(["/", "/privacy", "/terms"]);

export function isSessionSetupRoute(pathname) {
  return pathname === "/passcode" || pathname === "/unlock";
}

export function isProtectedAppRoute(pathname) {
  return !isSessionSetupRoute(pathname) && !PUBLIC_ROUTES.has(pathname);
}

export function readClientSession() {
  if (typeof window === "undefined") {
    return {
      hasPin: false,
      isVerified: false,
      isUnlocked: false,
    };
  }

  const hasPin = Boolean(localStorage.getItem("user_pin"));
  const isVerified = sessionStorage.getItem("pin_verified") === "true";

  return {
    hasPin,
    isVerified,
    isUnlocked: !hasPin || isVerified,
  };
}

export function getSessionRedirect(pathname, token) {
  if (!token) {
    return PUBLIC_ROUTES.has(pathname) ? null : "/";
  }

  const { hasPin, isVerified } = readClientSession();

  if (!hasPin) {
    return pathname === "/passcode" ? null : "/passcode";
  }

  if (!isVerified) {
    return pathname === "/unlock" ? null : "/unlock";
  }

  return isSessionSetupRoute(pathname) ? "/" : null;
}
