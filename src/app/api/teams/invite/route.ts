import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  // This client is used to get the current user session
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
          } catch {
            // ignore if not mutable in this context
          }
        },
      },
    }
  )

  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { email, team_id, role } = await req.json()
    if (!email || !team_id) {
      return new NextResponse(JSON.stringify({ error: 'Email and team ID are required' }), { status: 400 })
    }
    const normalizedRole = String(role || 'member').toLowerCase()
    const allowedRoles = ['member', 'marketing', 'admin'] as const
    if (!(allowedRoles as readonly string[]).includes(normalizedRole)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid role. Must be one of member, marketing, admin.' }), { status: 400 })
    }

    // Authorization: only website owner or team owner may invite
    const { data: siteRoleRow } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle()

    const isSiteOwner = siteRoleRow?.role === 'owner'
    let isTeamOwner = false
    if (!isSiteOwner) {
      const { data: teamMemberRow } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team_id)
        .eq('user_id', currentUser.id)
        .maybeSingle()
      isTeamOwner = teamMemberRow?.role === 'owner'
    }

    if (!isSiteOwner && !isTeamOwner) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden: only the website owner or team owner can invite.' }), { status: 403 })
    }

    // Only site owner or team owner can invite admins (team owner limited to their team)
    if (normalizedRole === 'admin' && !(isSiteOwner || isTeamOwner)) {
      return new NextResponse(JSON.stringify({ error: 'Only the website owner or the owner of this team can invite admin users.' }), { status: 403 })
    }

    // Admin client is needed for privileged operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Always attempt to send an invite; handle the "already registered" case gracefully.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      // Use a dedicated hash callback page to reliably finalize tokens before hitting /account
      redirectTo: `${siteUrl}/auth/hash-callback?redirect=${encodeURIComponent('/account')}`,
    })
    if (inviteError) {
      const msg = String(inviteError.message || '')
      const alreadyRegistered = /already\s*.*registered/i.test(msg) || /already\s*.*exist/i.test(msg)
      if (!alreadyRegistered) {
        console.error('Supabase invite error:', inviteError.message)
        return new NextResponse(JSON.stringify({ error: 'Failed to invite user.' }), { status: 500 })
      }
      // User already exists; proceed without failing.
      console.warn('Invite skipped: user already registered')
    }
    // If the user is already registered, we continue without failing.

    // For both new and existing users, create a record in our public `team_invites` table.
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    // Insert invite with service role to bypass RLS after we have authorized the caller above
    const { data: newInvite, error: dbError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        team_id: team_id,
        email: email.toLowerCase(),
        role: normalizedRole,
        token: crypto.randomUUID(), // Still useful for tracking, even if not used in a URL
        expires_at,
      })
      .select('*, teams(name)')
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError.message)
      // Handle case where invite already exists
      if (dbError.code === '23505') { 
        return new NextResponse(JSON.stringify({ error: 'An invitation for this user to this team already exists.' }), { status: 409 })
      }
      return new NextResponse(JSON.stringify({ error: 'Failed to save invitation to database.' }), { status: 500 })
    }

    return NextResponse.json(newInvite)

  } catch (e: unknown) {
    return new NextResponse(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), { status: 500 })
  }
}
