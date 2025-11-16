"use client";
import { Suspense, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { clientLog } from "@/utils/debug";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const supabase = getSupabaseBrowserClient();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill last-used email for convenience
  useEffect(() => {
    try {
      const last = sessionStorage.getItem("ia_last_email");
      if (last) setEmail(last);
    } catch {}
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      try {
        sessionStorage.setItem("ia_last_email", email);
      } catch {}
      clientLog("login:send_otp", { email, redirect });
      const siteUrl = (typeof window !== 'undefined' && window.location?.origin) 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setSent(true);
      clientLog("login:otp_sent", {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send link");
      clientLog("login:error", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="system-theme min-h-[70vh] grid place-content-center p-6 pt-32">
      <div className="w-[min(92vw,520px)] rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your work email and we’ll email you a secure, one‑time sign‑in link.
          </p>

          {sent ? (
            <div className="mt-6 rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-100">
              We sent a sign‑in link to <span className="font-medium">{email}</span>.
              <div className="mt-2 opacity-80">
                Open the link on this device to finish signing in. Check spam or promotions if you don’t see it.
              </div>
              <div className="mt-3 text-xs opacity-70">
                Wrong email? Refresh the page to try again or go back.
              </div>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="mt-6 grid gap-4" noValidate>
              <label className="grid gap-1">
                <span className="text-sm text-foreground">Email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-input bg-background/50 text-foreground placeholder:opacity-60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Email me a sign‑in link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-xs text-muted-foreground">
            By continuing, you agree to our
            {" "}
            <a className="underline hover:opacity-80" href="/terms">Terms</a>
            {" "}and{ " "}
            <a className="underline hover:opacity-80" href="/privacy">Privacy Policy</a>.
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Having trouble? <a className="underline hover:opacity-80" href="/contact">Contact support</a>.
          </div>
        </div>
      </div>
    </section>
  );
}
