"use client";
import { Suspense, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { clientLog } from "@/utils/debug";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, go to /account
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        clientLog("register:already_signed_in", {});
        router.replace("/account");
      }
    });
  }, [router, supabase]);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      try {
        sessionStorage.setItem("ia_last_email", email);
      } catch {}
      // Use magic-link signup to avoid password requirement
      clientLog("register:send_otp", { email, redirect });
      const siteUrl = (typeof window !== 'undefined' && window.location?.origin)
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
      clientLog("register:otp_sent", {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
      clientLog("register:error", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-content-center p-6">
      <div className="w-[min(92vw,440px)] rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-white">
        <h1 className="text-xl font-semibold">Create Account</h1>
        <p className="mt-1 text-sm text-white/70">We’ll email you a magic link to finish setup.</p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/90">
            Check your email for a magic link to finish creating your account.
            <div className="mt-2 text-white/70">Once you click the link, you’ll be signed in and brought back to the site.</div>
          </div>
        ) : (
          <form onSubmit={register} className="mt-6 grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-white/90">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
