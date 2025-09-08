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
      try {
        (window as unknown as { __IA_AUTH_HASH_IN_PROGRESS__?: boolean }).__IA_AUTH_HASH_IN_PROGRESS__ = true;
        sessionStorage.setItem('IA_AUTH_HASH_STATUS', 'processing');
      } catch {}
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
          // 1) Hydrate client session
          await supabase.auth.setSession({ access_token, refresh_token });

          // 2) Sync httpOnly cookies on the server for middleware/RSC
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token })
          });
          
          // 3) Wait for client to fully persist session
          await new Promise((r) => setTimeout(r, 150));
          
          // 4) Ensure client user is readable
          await supabase.auth.getUser();

          // 5) Verify the server can see the session (cookie set), retry briefly if needed
          for (let i = 0; i < 6; i++) {
            try {
              const res = await fetch('/api/auth/bootstrap', { credentials: 'same-origin', cache: 'no-store' });
              if (res.ok) { break; }
            } catch {}
            await new Promise((r) => setTimeout(r, 150));
          }
          // Proceed regardless, but ok indicates server is aware
        } finally {
          try { sessionStorage.setItem('IA_AUTH_HASH_STATUS', 'done'); (window as unknown as { __IA_AUTH_HASH_IN_PROGRESS__?: boolean }).__IA_AUTH_HASH_IN_PROGRESS__ = false; } catch {}
          // For invite links, take the user to account to surface the invite modal
          if (type === 'invite') {
            // Hard replace to ensure middleware/server see cookies
            window.location.replace('/account');
          } else {
            // As a safety, reload to ensure UI reflects new session
            try { window.location.reload(); } catch {}
          }
        }
      })();
    }
  }, []);
  return null;
}
