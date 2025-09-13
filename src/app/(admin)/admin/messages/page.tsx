"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Search, CheckCircle2, Undo2 } from "lucide-react";
import { cn } from "@/utils/cn";

type Msg = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  handled: boolean;
  handled_by: string | null;
  handled_at: string | null;
};

export default function AdminMessagesPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "handled">("open");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,message,created_at,handled,handled_by,handled_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    setItems((data as Msg[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((m) => {
      if (status === "open" && m.handled) return false;
      if (status === "handled" && !m.handled) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
      );
    });
  }, [items, q, status]);

  async function setHandled(id: string, handled: boolean) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("contact_messages")
      .update({ handled, handled_at: handled ? now : null })
      .eq("id", id);
    if (!error) {
      setItems((prev) => prev.map((m) => m.id === id ? { ...m, handled, handled_at: handled ? now : null } : m));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 h-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">Contact form submissions from the site.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search messages..."
              className="w-64 rounded-full border border-border/60 bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur focus:border-border focus:outline-none"
            />
          </div>
          <FilterButton label="Open" active={status === "open"} onClick={() => setStatus("open")} />
          <FilterButton label="Handled" active={status === "handled"} onClick={() => setStatus("handled")} />
          <FilterButton label="All" active={status === "all"} onClick={() => setStatus("all")} />
        </div>
      </header>

      <Card className="overflow-hidden border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Newest first. Mark handled when resolved.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3 rounded-md border border-border/60 bg-card/60 p-3 text-sm text-rose-800 dark:text-rose-200">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No messages.</TableCell></TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{m.email}</TableCell>
                    <TableCell className="max-w-[480px]"><span className="line-clamp-2 text-foreground/90">{m.message}</span></TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(m.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {m.handled ? (
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="outline" className="text-xs">Handled</Badge>
                          <button
                            onClick={() => setHandled(m.id, false)}
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs text-foreground/90 hover:border-border"
                            title="Mark as open"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setHandled(m.id, true)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-200 hover:border-emerald-400/50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark handled
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs backdrop-blur",
        active ? "border-foreground bg-foreground text-background" : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
