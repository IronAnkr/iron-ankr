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
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const armTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => { if (mounted) setLoading(false); }, 5000);
    };
    type TeamRow = { role: "owner"|"admin"|"marketing"|"member"; teams: { slug: string | null; name: string | null } | null };
    async function load() {
      setLoading(true); armTimeout();
      try {
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
          if (!mounted) return;
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
              .eq("user_id", user.id);
            if (!mounted) return;
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
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      setLoading(true); armTimeout();
      try {
        const u = session?.user;
        setEmail(u?.email ?? null);
        if (u?.id) {
          const { data: roleRow } = await supabase
            .from("app_users")
            .select("role")
            .eq("id", u.id)
            .maybeSingle();
          if (!mounted) return;
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
            if (!mounted) return;
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
      } finally {
        if (mounted) setLoading(false);
      }
    });
    const onTeamsChanged = () => {
      // Team membership changed elsewhere (e.g., invite accepted); refresh
      load();
    };
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    window.addEventListener('ia:teams-changed', onTeamsChanged as EventListener);
    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
      document.removeEventListener("click", onDocClick);
      window.removeEventListener('ia:teams-changed', onTeamsChanged as EventListener);
      if (timeout) clearTimeout(timeout);
    };
  }, [supabase]);

  // If we already have an email, ensure loading is not stuck
  useEffect(() => {
    if (email !== null) setLoading(false);
  }, [email]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    // Soft refresh to update UI state
    window.location.reload();
  }

  return (
    <div ref={containerRef} className="relative system-theme">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={loading}
        disabled={loading}
        onClick={() => !loading && setOpen((v) => !v)}
        className={`relative inline-flex items-center justify-center h-9 w-9 rounded-full border px-0 ${
          loading
            ? "cursor-not-allowed opacity-70 border-border/40 bg-background/40 text-foreground/70"
            : "border-border/60 bg-background/50 text-foreground/90 hover:border-border"
        }`}
        title={email ?? "Sign in"}
      >
        <div className="relative">
          <User2 className="h-4 w-4" />
          {loading && (
            <span
              className="pointer-events-none absolute -inset-2 rounded-full border-2 border-foreground/30 border-t-transparent animate-spin"
              aria-hidden
            />
          )}
        </div>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border/60 bg-card/80 backdrop-blur-md shadow-xl z-[60] text-foreground"
        >
          <div className="py-1 text-sm">
            {email ? (
              <>
                {isOwner && (
                  <>
                    <Link href="/owner" className="block px-3 py-2 hover:bg-background/50">Owner Dashboard</Link>
                    <Link href="/admin" className="block px-3 py-2 hover:bg-background/50">Admin Dashboard</Link>
                    <Link href="/marketing" className="block px-3 py-2 hover:bg-background/50">Marketing Dashboard</Link>
                  </>
                )}
                {!isOwner && (
                  <>
                    {showAdminDashboard && (
                      <Link href="/admin" className="block px-3 py-2 hover:bg-background/50">Admin Dashboard</Link>
                    )}
                    {showMarketingDashboard && (
                      <Link href="/marketing" className="block px-3 py-2 hover:bg-background/50">Marketing Dashboard</Link>
                    )}
                  </>
                )}
                <Link href="/account" className="block px-3 py-2 hover:bg-background/50">Account</Link>
                <Link href="/account/orders" className="block px-3 py-2 hover:bg-background/50">My Orders</Link>
                <Link href="/account/settings" className="block px-3 py-2 hover:bg-background/50">Settings</Link>
                <button onClick={signOut} className="block w-full text-left px-3 py-2 hover:bg-background/50">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 hover:bg-background/50">Sign in</Link>
                <Link href="/register" className="block px-3 py-2 hover:bg-background/50">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
