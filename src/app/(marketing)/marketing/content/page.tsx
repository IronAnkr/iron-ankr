"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type Post = {
  id: string;
  title: string;
  platform: string;
  status: string;
  publish_at: string | null;
  url: string | null;
  created_at: string;
};

export default function MarketingContentPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("site");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);
  const { isMarketingAdmin } = useMarketingAccess();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_posts")
      .select("id,title,platform,status,publish_at,url,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data as Post[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("content_posts")
      .insert({ title: title.trim(), platform, publish_at: publishAt ? new Date(publishAt).toISOString() : null })
      .select()
      .single();
    if (error) setError(error.message);
    if (data) setItems((prev) => [data as Post, ...prev]);
    setTitle(""); setPlatform("site"); setPublishAt("");
    setSaving(false);
  }

  async function remove(id: string) {
    if (!isMarketingAdmin) return;
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("content_posts").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-white">Content</h1>
        <p className="text-sm text-white/70">Plan and schedule content across platforms.</p>
      </header>

      <form onSubmit={createPost} className="rounded-lg border border-white/10 bg-black/60 p-4 grid gap-3 md:grid-cols-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" required />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-md border-white/20 bg-black/80 px-3 py-2 text-white">
          <option value="site">Site</option>
          <option value="blog">Blog</option>
          <option value="ig">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="yt">YouTube</option>
          <option value="email">Email</option>
          <option value="x">X</option>
          <option value="fb">Facebook</option>
          <option value="pin">Pinterest</option>
          <option value="reddit">Reddit</option>
        </select>
        <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" />
        <div className="md:col-span-3">
          <button disabled={!title.trim() || saving} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving…' : 'Create post'}</button>
        </div>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {loading ? (
        <div className="text-white/80">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm text-white/90">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Status</th>
                <th className="p-3">Publish at</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 text-left">{p.title}</td>
                  <td className="p-3 text-center uppercase text-white/80">{p.platform}</td>
                  <td className="p-3 text-center">{p.status}</td>
                  <td className="p-3 text-center">{p.publish_at ? new Date(p.publish_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-center">
                    {isMarketingAdmin && (
                      <button onClick={() => remove(p.id)} className="text-rose-300 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
