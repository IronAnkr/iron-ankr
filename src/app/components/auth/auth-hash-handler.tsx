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
    const type = params["type"]; // e.g., 'invite'
    if (access_token && refresh_token) {
      // Clean the URL immediately so users don't see the hash for long
      try {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
      } catch {
        // Fallback to hard replace
        window.location.replace(window.location.pathname + window.location.search);
      }

      // Finalize the session from the invite link, then sync cookies on server
      (async () => {
        try {
          await supabase.auth.setSession({ access_token, refresh_token });
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token })
          });
        } finally {
          // For invite links, take the user to account to surface the invite modal
          if (type === 'invite') {
            window.location.assign('/account');
          } else {
            // As a safety, reload to ensure UI reflects new session
            setTimeout(() => {
              try { window.location.reload(); } catch {}
            }, 10);
          }
        }
      })();
    }
  }, []);
  return null;
}
