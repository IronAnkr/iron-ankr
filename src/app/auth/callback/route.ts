import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch { /* ignore */ }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After server exchange, hydrate the browser session via a post-callback page
      const url = new URL('/auth/post-callback', requestUrl.origin)
      url.searchParams.set('redirect', redirect)
      return NextResponse.redirect(url)
    }
  }

  // return the user to an error page with instructions
  const errorUrl = new URL('/login', requestUrl.origin)
  errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
  return NextResponse.redirect(errorUrl)
}

