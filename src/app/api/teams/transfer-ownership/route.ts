import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const team_id: string = body.team_id
    const email: string = String(body.email || '').toLowerCase()
    if (!team_id || !email) return NextResponse.json({ error: 'team_id and email are required' }, { status: 400 })

    // Authorization: site owner or current team owner
    const { data: siteRole } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const isSiteOwner = siteRole?.role === 'owner'

    let isTeamOwner = false
    if (!isSiteOwner) {
      const { data: tm } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team_id)
        .eq('user_id', user.id)
        .maybeSingle()
      isTeamOwner = tm?.role === 'owner'
    }

    if (!(isSiteOwner || isTeamOwner)) {
      return NextResponse.json({ error: 'Forbidden: only website owner or team owner can transfer ownership.' }, { status: 403 })
    }

    // Resolve target user by email
    const { data: targetUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (!targetUser?.id) {
      return NextResponse.json({ error: 'User not found by email. Invite them first.' }, { status: 404 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Demote all existing owners on this team to admin
    const { error: demoteErr } = await admin
      .from('team_members')
      .update({ role: 'admin' })
      .eq('team_id', team_id)
      .eq('role', 'owner')
    if (demoteErr) {
      return NextResponse.json({ error: 'Failed to demote existing owner(s): ' + demoteErr.message }, { status: 500 })
    }

    // Upsert the target as owner
    const { error: upsertErr } = await admin
      .from('team_members')
      .upsert({ team_id, user_id: targetUser.id, role: 'owner' }, { onConflict: 'team_id,user_id' })
    if (upsertErr) {
      return NextResponse.json({ error: 'Failed to set new owner: ' + upsertErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 500 })
  }
}
