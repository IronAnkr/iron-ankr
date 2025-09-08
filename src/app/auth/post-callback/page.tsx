"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

function PostCallbackInner() {
  const supabase = getSupabaseBrowserClient();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [message, setMessage] = useState("Finalizing sign-in…");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/bootstrap', { credentials: 'same-origin' });
        if (res.ok) {
          const { access_token, refresh_token } = await res.json();
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
        await new Promise((r) => setTimeout(r, 50));
        if (!mounted) return;
        await supabase.auth.getUser();
        window.location.replace(redirect);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setMessage(`Error: ${msg}`);
        setTimeout(() => { window.location.replace(`/login?error=${encodeURIComponent(msg)}`); }, 500);
      }
    })();
    return () => { mounted = false; };
  }, [redirect, supabase]);

  return (
    <div className="min-h-[60vh] grid place-content-center p-6 text-white/80 text-center">
      <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-6 py-5">{message}</div>
    </div>
  );
}

export default function PostCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PostCallbackInner />
    </Suspense>
  );
}
