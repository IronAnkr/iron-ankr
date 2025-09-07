"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type Metadata = {
  full_name?: string;
  phone?: string;
};

export default function AccountPage() {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("user");
  const [meta, setMeta] = useState<Metadata>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) {
        if (mounted) setLoading(false);
        return; // not signed in
      }
      const { data, error } = await supabase
        .from("app_users")
        .select("email, role, metadata")
        .eq("id", uid)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        setError(error.message);
      } else if (data) {
        setEmail(data.email);
        setRole(data.role);
        setMeta((data.metadata as Metadata) || {});
      }
      setLoading(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (s?.user) {
        setLoading(true);
        load();
      }
    });
    return () => { mounted = false; sub.subscription?.unsubscribe(); };
  }, [supabase]);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("app_users")
        .update({ metadata: meta })
        .eq("id", uid);
      if (error) throw error;
      setNotice("Profile updated");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-content-center p-6 text-white/80">Loading account…</div>
    );
  }

  return (
    <div className="min-h-[60vh] p-6">
      <div className="mx-auto w-[min(96vw,720px)] space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Account</h1>
          <p className="text-sm text-white/70">View and update your profile details.</p>
        </header>

        <section className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6 text-white">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-white/90">Email</label>
              <input value={email} readOnly className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-white/90">Role</label>
              <input value={role} readOnly className="w-full rounded-md border border-white/10 bg-white/5 text-white px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-white/90">Full name</label>
              <input
                value={meta.full_name ?? ""}
                onChange={(e) => setMeta((m) => ({ ...m, full_name: e.target.value }))}
                placeholder="Your name"
                className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-white/90">Phone</label>
              <input
                value={meta.phone ?? ""}
                onChange={(e) => setMeta((m) => ({ ...m, phone: e.target.value }))}
                placeholder="(555) 555‑1234"
                className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}

          <div className="mt-4 flex items-center gap-2">
            <button onClick={save} disabled={saving} className="rounded-md bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button onClick={() => window.location.reload()} className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">Discard</button>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-6 text-white">
          <h2 className="text-lg font-semibold">Account actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/account/orders" className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">View orders</a>
            <a href="/login" className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">Sign in as different user</a>
          </div>
        </section>
      </div>
    </div>
  );
}
