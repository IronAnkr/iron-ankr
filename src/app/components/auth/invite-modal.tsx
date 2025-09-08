"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

type InviteRow = {
  id: string;
  team_id: string;
  email: string;
  role: "owner" | "admin" | "marketing" | "member";
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  team_name?: string | null;
};

export function InviteModalWatcher() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load pending invite on mount and when auth state changes
  useEffect(() => {
    let active = true;

    const fetchInvites = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user?.email) {
        if (active) {
          setInvite(null);
          setLoading(false);
          
        }
        return;
      }

      const nowIso = new Date().toISOString();
      // Fetch pending invite without join to avoid relationship errors under RLS
      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .is("accepted_at", null)
        .gte("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1);

      const row: InviteRow | null = (data && (data[0] as InviteRow)) || null;

      if (row) {
        // Try to load team name separately; ignore failures
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", row.team_id)
          .maybeSingle();
        row.team_name = team?.name ?? null;
      }

      if (active) {
        if (error) {
          console.error("Failed to fetch invites:", error.message);
        }
        setInvite(row);
        setLoading(false);
        
      }
    };

    fetchInvites();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchInvites();
    });

    const onVis = () => {
      if (document.visibilityState === 'visible') fetchInvites();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      active = false;
      sub.subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [supabase]);

  const onAccept = async () => {
    if (!invite) return;
    setActionLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      // Add membership; ignore duplicate insert errors
      const { error: memberErr } = await supabase
        .from("team_members")
        .insert({ team_id: invite.team_id, user_id: user.id, role: invite.role || "member" });

      if (memberErr && memberErr.code !== "23505") {
        console.error("Failed to add member:", memberErr.message);
      }

      // Mark the invite accepted
      const { error: updateErr } = await supabase
        .from("team_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      if (updateErr) {
        console.error("Failed to update invite:", updateErr.message);
      }

      setInvite(null);
      try { window.dispatchEvent(new Event('ia:teams-changed')); } catch {}
    } finally {
      setActionLoading(false);
    }
  };

  const onReject = async () => {
    if (!invite) return;
    setActionLoading(true);
    try {
      // Simply delete the invite
      const { error } = await supabase
        .from("team_invites")
        .delete()
        .eq("id", invite.id);
      if (error) {
        console.error("Failed to delete invite:", error.message);
      }
      setInvite(null);
      try { window.dispatchEvent(new Event('ia:teams-changed')); } catch {}
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !invite) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/90 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold mb-2">You’ve been invited!</h2>
        <p className="text-sm text-zinc-300">
          Congratulations, you’ve been invited to join the team
          {" "}
          <span className="font-medium text-white">{invite.team_name || "(unknown)"}</span>.
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Role: <span className="uppercase tracking-wide">{invite.role}</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onReject}
            disabled={actionLoading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            onClick={onAccept}
            disabled={actionLoading}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
