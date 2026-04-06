import { useState, useEffect } from "react";

/**
 * Generates a UUID v4 using the browser's native crypto API.
 * Falls back to a Math.random-based polyfill for older environments.
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UseVariantReturn {
  variant: "A" | "B";
  sessionId: string;
}

const VARIANT_KEY = "atlasadvisor_variant";
const SESSION_KEY = "atlasadvisor_session";

/**
 * Assigns and persists a 50/50 A/B variant and a unique session ID.
 * Both are stored in localStorage so they survive page refreshes within a session.
 */
export function useVariant(): UseVariantReturn {
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Retrieve or assign variant
    let storedVariant = localStorage.getItem(VARIANT_KEY) as "A" | "B" | null;
    if (!storedVariant || (storedVariant !== "A" && storedVariant !== "B")) {
      storedVariant = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem(VARIANT_KEY, storedVariant);
    }
    setVariant(storedVariant);

    // Retrieve or create session ID
    let storedSession = localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      storedSession = generateUUID();
      localStorage.setItem(SESSION_KEY, storedSession);
    }
    setSessionId(storedSession);
  }, []);

  return { variant, sessionId };
}
