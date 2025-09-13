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
        <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground">Create, assign, and track marketing work.</p>
      </header>

      <form onSubmit={createTask} className="rounded-lg border border-border/60 bg-card/60 p-4 grid gap-3 sm:grid-cols-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" required />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground">
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground" />
        <div className="sm:col-span-3">
          <button disabled={saving || !title.trim()} className="rounded-md bg-foreground text-background hover:bg-foreground/90 px-3 py-2 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Create task'}</button>
        </div>
      </form>

      {error && <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setTab("todo")} className={`rounded-md border px-3 py-1.5 ${tab==='todo' ? 'bg-foreground text-background border-foreground' : 'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground'}`}>To do</button>
        <button onClick={() => setTab("in_progress")} className={`rounded-md border px-3 py-1.5 ${tab==='in_progress' ? 'bg-foreground text-background border-foreground' : 'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground'}`}>In progress</button>
        <button onClick={() => setTab("done")} className={`rounded-md border px-3 py-1.5 ${tab==='done' ? 'bg-foreground text-background border-foreground' : 'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground'}`}>Done</button>
        <button onClick={() => setTab("all")} className={`rounded-md border px-3 py-1.5 ${tab==='all' ? 'bg-foreground text-background border-foreground' : 'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground'}`}>All</button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm text-foreground/90">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visibleTasks.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 text-left">{t.title}</td>
                  <td className="p-3 text-center">{emailFor(t.assignee)}</td>
                  <td className="p-3 text-center">{t.due_at ? new Date(t.due_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-center uppercase text-muted-foreground">{t.status.replace('_',' ')}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {t.status !== 'in_progress' && (
                      <button onClick={() => updateStatus(t.id, 'in_progress')} className="text-muted-foreground hover:text-foreground hover:underline">Start</button>
                    )}
                    {t.status !== 'done' && (
                      <button onClick={() => updateStatus(t.id, 'done')} className="hover:underline text-emerald-700 dark:text-emerald-300">Complete</button>
                    )}
                    {isMarketingAdmin && (
                      <button onClick={() => remove(t.id)} className="text-destructive hover:underline">Delete</button>
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
