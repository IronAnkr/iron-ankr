"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function HashCallbackInner() {
  const supabase = getSupabaseBrowserClient();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const [msg, setMsg] = useState("Finalizing sign-in…");
  const ranRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (ranRef.current) return; // Guard against React StrictMode double-invoke in dev
    ranRef.current = true;
    (async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const hp = parseHashParams(hash);
        const access_token = hp["access_token"]; const refresh_token = hp["refresh_token"]; 

        // Clean URL (remove hash ASAP)
        try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch {}

        if (access_token && refresh_token) {
          // Hydrate client session from hash tokens
          setMsg("Setting session…");
          await supabase.auth.setSession({ access_token, refresh_token });

          // Sync server cookies
          setMsg("Syncing session…");
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, refresh_token }),
            credentials: 'same-origin',
          });
        } else {
          // PKCE flow: use code parameter instead of hash tokens
          const code = params.get('code');
          if (!code) {
            // If no tokens nor code, check if a session already exists (e.g., previous effect run)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) { window.location.replace(redirect); return; }
            window.location.replace(`/login?error=${encodeURIComponent('Missing invite tokens')}`);
            return;
          }
          setMsg('Exchanging code…');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) {
            window.location.replace(`/login?error=${encodeURIComponent(error?.message || 'Auth failed')}`);
            return;
          }
          const at = data.session.access_token;
          const rt = data.session.refresh_token;
          setMsg('Syncing session…');
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: at, refresh_token: rt }),
            credentials: 'same-origin',
          });
        }

        // Allow persistence and verify client
        await new Promise((r) => setTimeout(r, 150));
        await supabase.auth.getUser();

        // Verify server sees session
        for (let i = 0; i < 6; i++) {
          const res = await fetch('/api/auth/bootstrap', { credentials: 'same-origin', cache: 'no-store' });
          if (res.ok) break;
          await new Promise((r) => setTimeout(r, 150));
        }

        if (!active) return;
        window.location.replace(redirect);
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setMsg(`Error: ${err}`);
        setTimeout(() => {
          try { window.location.replace(`/login?error=${encodeURIComponent(err)}`); } catch {}
        }, 600);
      }
    })();
    return () => { active = false; };
  }, [redirect, supabase, params]);

  return (
    <div className="min-h-[60vh] grid place-content-center p-6 text-white/80 text-center">
      <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-6 py-5">{msg}</div>
    </div>
  );
}

export default function HashCallbackPage() {
  return (
    <Suspense fallback={null}>
      <HashCallbackInner />
    </Suspense>
  );
}
