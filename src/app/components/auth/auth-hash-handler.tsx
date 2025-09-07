"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = hash.replace(/^#/, "");
  for (const part of q.split("&")) {
    const [k, v] = part.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

export function AuthHashHandler() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.length < 2) return;
    const params = parseHashParams(hash);
    const access_token = params["access_token"];
    const refresh_token = params["refresh_token"];
    if (access_token && refresh_token) {
      // Finalize the session from the invite link, sync cookies on server, then clean URL hash.
      (async () => {
        try {
          await supabase.auth.setSession({ access_token, refresh_token })
          // Sync session cookies server-side so middleware/API see the user
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token })
          })
        } finally {
          try {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          } catch {
            window.location.replace(window.location.pathname + window.location.search);
          }
        }
      })();
    }
  }, []);
  return null;
}
