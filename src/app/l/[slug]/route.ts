import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  const { data: link } = await supabase
    .from('marketing_links')
    .select('id, destination, utm_source, utm_medium, utm_campaign, utm_content')
    .eq('slug', slug)
    .maybeSingle()

  if (!link) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Build destination with UTM params
  const url = new URL(link.destination)
  if (link.utm_source) url.searchParams.set('utm_source', link.utm_source)
  if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium)
  if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign)
  if (link.utm_content) url.searchParams.set('utm_content', link.utm_content)

  // Fire and forget: record click event (no block on redirect)
  supabase.from('link_click_events').insert({
    link_id: link.id,
    ua: req.headers.get('user-agent') || null,
    referrer: req.headers.get('referer') || null,
  })

  return NextResponse.redirect(url, 302)
}
