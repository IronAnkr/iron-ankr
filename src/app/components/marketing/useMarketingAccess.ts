"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export function useMarketingAccess() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) { setIsAdmin(false); setIsMember(false); setLoading(false); } return; }
      const [{ data: appRole }, { data: teamRows }] = await Promise.all([
        supabase.from('app_users').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('team_members').select('role, teams(slug,name)').eq('user_id', user.id),
      ]);
      const siteAdmin = appRole?.role === 'admin' || appRole?.role === 'owner';
      type TeamRow = { role: 'owner'|'admin'|'marketing'|'member'; teams: { slug: string | null; name: string | null } | null };
      const rows = (teamRows as TeamRow[] | null) || [];
      const inMarketing = rows.find((r: TeamRow) => (r.teams?.slug === 'marketing' || r.teams?.name?.toLowerCase() === 'marketing'));
      const member: boolean = Boolean(inMarketing);
      const admin: boolean = Boolean(siteAdmin || (inMarketing && (inMarketing.role === 'owner' || inMarketing.role === 'admin')));
      if (active) {
        setIsMember(member);
        setIsAdmin(admin);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  return { loading, isMarketingAdmin: isAdmin, isMarketingMember: isMember };
}
