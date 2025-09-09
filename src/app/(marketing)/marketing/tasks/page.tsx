"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { useMarketingAccess } from "@/app/components/marketing/useMarketingAccess";

type TaskStatus = "todo" | "in_progress" | "done";
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string | null; // user id
  due_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  created_by: string | null;
};

type AppUser = { id: string; email: string };

export default function MarketingTasksPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { isMarketingAdmin } = useMarketingAccess();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<TaskStatus | "all">("todo");

  // Create form
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [{ data: tData, error: tErr }, { data: uData, error: uErr }] = await Promise.all([
        supabase
          .from("marketing_tasks")
          .select("id,title,status,assignee,due_at,entity_type,entity_id,created_at,created_by")
          .order("created_at", { ascending: false }),
        supabase
          .from("app_users")
          .select("id,email")
          .order("email", { ascending: true })
      ]);
      if (tErr) throw tErr;
      if (uErr) throw uErr;
      setTasks((tData as Task[] | null) ?? []);
      setUsers((uData as AppUser[] | null) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const visibleTasks = tasks.filter((t) => (tab === "all" ? true : t.status === tab));

  async function createTask(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return; setSaving(true); setError(null);
    try {
      const payload = {
        id: crypto.randomUUID(),
        title: title.trim(),
        status: "todo" as TaskStatus,
        assignee: assignee || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      };
      const { error } = await supabase.from("marketing_tasks").insert(payload);
      if (error) throw error;
      setTitle(""); setAssignee(""); setDueAt("");
      void load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    try {
      const { error } = await supabase.from("marketing_tasks").update({ status }).eq("id", id);
      if (error) throw error;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  async function remove(id: string) {
    if (!isMarketingAdmin) return;
    if (!confirm("Delete this task?")) return;
    try {
      const { error } = await supabase.from("marketing_tasks").delete().eq("id", id);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  function emailFor(id: string | null) {
    if (!id) return "Unassigned";
    const u = users.find((x) => x.id === id);
    return u?.email || "Unknown";
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-white">Tasks</h1>
        <p className="text-sm text-white/70">Create, assign, and track marketing work.</p>
      </header>

      <form onSubmit={createTask} className="rounded-lg border border-white/10 bg-black/60 p-4 grid gap-3 sm:grid-cols-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" required />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-md border-white/20 bg-black/80 px-3 py-2 text-white">
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="rounded-md border-white/20 bg-white/5 px-3 py-2 text-white" />
        <div className="sm:col-span-3">
          <button disabled={saving || !title.trim()} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving…' : 'Create task'}</button>
        </div>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setTab("todo")} className={`rounded-md border px-3 py-1.5 ${tab==='todo' ? 'bg-white text-black border-white' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>To do</button>
        <button onClick={() => setTab("in_progress")} className={`rounded-md border px-3 py-1.5 ${tab==='in_progress' ? 'bg-white text-black border-white' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>In progress</button>
        <button onClick={() => setTab("done")} className={`rounded-md border px-3 py-1.5 ${tab==='done' ? 'bg-white text-black border-white' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>Done</button>
        <button onClick={() => setTab("all")} className={`rounded-md border px-3 py-1.5 ${tab==='all' ? 'bg-white text-black border-white' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>All</button>
      </div>

      {loading ? (
        <div className="text-white/80">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm text-white/90">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {visibleTasks.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 text-left">{t.title}</td>
                  <td className="p-3 text-center">{emailFor(t.assignee)}</td>
                  <td className="p-3 text-center">{t.due_at ? new Date(t.due_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-center uppercase text-white/70">{t.status.replace('_',' ')}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {t.status !== 'in_progress' && (
                      <button onClick={() => updateStatus(t.id, 'in_progress')} className="text-blue-300 hover:underline">Start</button>
                    )}
                    {t.status !== 'done' && (
                      <button onClick={() => updateStatus(t.id, 'done')} className="text-emerald-300 hover:underline">Complete</button>
                    )}
                    {isMarketingAdmin && (
                      <button onClick={() => remove(t.id)} className="text-rose-300 hover:underline">Delete</button>
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

