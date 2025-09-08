import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [teamsResult, invitesResult, siteRoleResult, myRolesResult] = await Promise.all([
      supabase.from('teams').select('*, team_members(count)'),
      supabase.from('team_invites').select('*, teams(name)').is('accepted_at', null),
      supabase.from('app_users').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('team_members').select('team_id, role').eq('user_id', user.id),
    ])

    // Fallback for invites join failure
    let invitesData = invitesResult.data
    if (invitesResult.error) {
      const basicInvites = await supabase.from('team_invites').select('*').is('accepted_at', null)
      if (!basicInvites.error) invitesData = basicInvites.data
    }

    if (teamsResult.error) {
      return NextResponse.json({ error: teamsResult.error.message }, { status: 400 })
    }

    type TeamMembersAgg = { team_members?: Array<{ count: number }> }
    type TeamRow = TeamMembersAgg & {
      id: string; name: string; slug?: string | null; created_at?: string; updated_at?: string;
      // Allow passthrough of other fields without using any
      [key: string]: unknown;
    }
    const teamsData = (teamsResult.data as TeamRow[] | null) ?? []
    const teams = teamsData.map((t) => ({
      ...t,
      member_count: Array.isArray(t.team_members) ? (t.team_members?.[0]?.count ?? 0) : 0,
    }))

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      site_role: siteRoleResult.data?.role || 'user',
      roles: (myRolesResult.data || []).reduce((acc: Record<string,string>, r: { team_id: string; role: string }) => { acc[r.team_id] = r.role; return acc }, {}),
      teams,
      invites: invitesData || [],
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 })
  }
}
