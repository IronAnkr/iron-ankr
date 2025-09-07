"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import { User2 } from "lucide-react";

export function UserDropdown() {
  const supabase = getSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showMarketingDashboard, setShowMarketingDashboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    type TeamRow = { role: "owner"|"admin"|"marketing"|"member"; teams: { slug: string | null; name: string | null } | null };
    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      if (user?.id) {
        const { data: roleRow } = await supabase
          .from("app_users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const userRole = roleRow?.role;
        const owner = userRole === "owner";
        setIsOwner(owner);

        if (owner) {
          // Owner sees all dashboards
          setShowAdminDashboard(true);
          setShowMarketingDashboard(true);
        } else {
          const appAdmin = userRole === "admin";
          // Team-level access via specific teams
          const { data: teamRows } = await supabase
            .from("team_members")
            .select("role, teams(slug,name)")
            .eq("user_id", user.id);

          const rows = (teamRows as TeamRow[] | null) || [];
          const hasMarketingTeamRole = rows.some(
            (r: TeamRow) =>
              (r.teams?.slug === "marketing" || r.teams?.name?.toLowerCase() === "marketing") &&
              (r.role === "marketing" || r.role === "admin" || r.role === "owner")
          );
          const hasAdminTeamAdmin = rows.some(
            (r: TeamRow) =>
              (r.teams?.slug === "admin" || r.teams?.name?.toLowerCase() === "admin") &&
              (r.role === "admin" || r.role === "owner")
          );

          setShowAdminDashboard(appAdmin || hasAdminTeamAdmin);
          setShowMarketingDashboard(appAdmin || hasMarketingTeamRole);
        }
      } else {
        setIsOwner(false);
        setShowAdminDashboard(false);
        setShowMarketingDashboard(false);
      }
      setLoading(false);
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      setLoading(true);
      const u = session?.user;
      setEmail(u?.email ?? null);
      if (u?.id) {
        const { data: roleRow } = await supabase
          .from("app_users")
          .select("role")
          .eq("id", u.id)
          .maybeSingle();
        const userRole = roleRow?.role;
        const owner = userRole === "owner";
        setIsOwner(owner);

        if (owner) {
          setShowAdminDashboard(true);
          setShowMarketingDashboard(true);
        } else {
          const appAdmin = userRole === "admin";
          const { data: teamRows } = await supabase
            .from("team_members")
            .select("role, teams(slug,name)")
            .eq("user_id", u.id);
          const rows2 = (teamRows as TeamRow[] | null) || [];
          const hasMarketingTeamRole = rows2.some(
            (r: TeamRow) =>
              (r.teams?.slug === "marketing" || r.teams?.name?.toLowerCase() === "marketing") &&
              (r.role === "marketing" || r.role === "admin" || r.role === "owner")
          );
          const hasAdminTeamAdmin = rows2.some(
            (r: TeamRow) =>
              (r.teams?.slug === "admin" || r.teams?.name?.toLowerCase() === "admin") &&
              (r.role === "admin" || r.role === "owner")
          );
          setShowAdminDashboard(appAdmin || hasAdminTeamAdmin);
          setShowMarketingDashboard(appAdmin || hasMarketingTeamRole);
        }
      } else {
        setIsOwner(false);
        setShowAdminDashboard(false);
        setShowMarketingDashboard(false);
      }
      setLoading(false);
    });
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
      document.removeEventListener("click", onDocClick);
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    // Soft refresh to update UI state
    window.location.reload();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={loading}
        disabled={loading}
        onClick={() => !loading && setOpen((v) => !v)}
        className={`relative inline-flex items-center justify-center h-9 w-9 rounded-full border bg-white/5 text-white/90 hover:border-white/30 ${
          loading ? "border-white/10 cursor-not-allowed opacity-70" : "border-white/15"
        }`}
        title={email ?? "Sign in"}
      >
        <div className="relative">
          <User2 className="h-4 w-4" />
          {loading && (
            <span
              className="pointer-events-none absolute -inset-2 rounded-full border-2 border-white/30 border-t-transparent animate-spin"
              aria-hidden
            />
          )}
        </div>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-black/70 backdrop-blur-md shadow-xl z-[60]"
        >
          <div className="py-1 text-sm text-white/90">
            {email ? (
              <>
                {isOwner && (
                  <>
                    <Link href="/owner" className="block px-3 py-2 hover:bg-white/10">Teams</Link>
                    <Link href="/admin" className="block px-3 py-2 hover:bg-white/10">Admin Dashboard</Link>
                    <Link href="/marketing" className="block px-3 py-2 hover:bg-white/10">Marketing Dashboard</Link>
                  </>
                )}
                {!isOwner && (
                  <>
                    {showAdminDashboard && (
                      <Link href="/admin" className="block px-3 py-2 hover:bg-white/10">Admin Dashboard</Link>
                    )}
                    {showMarketingDashboard && (
                      <Link href="/marketing" className="block px-3 py-2 hover:bg-white/10">Marketing Dashboard</Link>
                    )}
                  </>
                )}
                <Link href="/account" className="block px-3 py-2 hover:bg-white/10">Account</Link>
                <Link href="/account/orders" className="block px-3 py-2 hover:bg-white/10">My Orders</Link>
                <Link href="/account/settings" className="block px-3 py-2 hover:bg-white/10">Settings</Link>
                <button onClick={signOut} className="block w-full text-left px-3 py-2 hover:bg-white/10">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 hover:bg-white/10">Sign in</Link>
                <Link href="/register" className="block px-3 py-2 hover:bg-white/10">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
