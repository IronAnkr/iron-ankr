"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type Prefs = {
  marketing_emails?: boolean;
  sms_opt_in?: boolean;
};

export default function AccountSettingsPage() {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return;
      const { data, error } = await supabase
        .from("app_users")
        .select("metadata")
        .eq("id", uid)
        .maybeSingle();
      if (!mounted) return;
      if (error) setError(error.message);
      const m = (data?.metadata as Record<string, unknown>) || {};
      setPrefs({
        marketing_emails: Boolean((m as Record<string, unknown>)["marketing_emails"]),
        sms_opt_in: Boolean((m as Record<string, unknown>)["sms_opt_in"]),
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // Fallback: if loading is stuck, try a one-time refresh then show message
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      if (!loading) return;
      try {
        const key = "ia_retry_account_settings_once";
        if (typeof window !== "undefined") {
          if (sessionStorage.getItem(key) !== "1") {
            sessionStorage.setItem(key, "1");
            window.location.reload();
            return;
          }
        }
      } catch {}
      setError((e) => e || "This is taking longer than expected. Please try again.");
      setLoading(false);
    }, 6000);
    return () => clearTimeout(t);
  }, [loading]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Not signed in");
      // Merge prefs into existing metadata
      const { data: current } = await supabase.from("app_users").select("metadata").eq("id", uid).maybeSingle();
      const nextMeta = { ...(current?.metadata as Record<string, unknown>), ...prefs };
      const { error } = await supabase.from("app_users").update({ metadata: nextMeta }).eq("id", uid);
      if (error) throw error;
      setNotice("Settings saved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[60vh] p-6">
      <div className="mx-auto w-[min(96vw,720px)] space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white">Account Settings</h1>
          <p className="text-sm text-white/70">Manage your communication preferences.</p>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-white">
          {loading ? (
            <div className="text-white/80">Loading settings…</div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!prefs.marketing_emails}
                  onChange={(e) => setPrefs((p) => ({ ...p, marketing_emails: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                <div>
                  <div className="text-sm">Marketing emails</div>
                  <div className="text-xs text-white/70">Get updates about new gear, drops, and promos.</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!prefs.sms_opt_in}
                  onChange={(e) => setPrefs((p) => ({ ...p, sms_opt_in: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                <div>
                  <div className="text-sm">SMS notifications</div>
                  <div className="text-xs text-white/70">Order alerts and delivery updates.</div>
                </div>
              </label>

              {error && <p className="text-sm text-rose-300">{error}</p>}
              {notice && <p className="text-sm text-emerald-300">{notice}</p>}

              <div className="pt-2">
                <button onClick={save} disabled={saving} className="rounded-md bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60">
                  {saving ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
