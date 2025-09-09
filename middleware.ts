import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Edge-safe Supabase client (no local imports)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          } catch {
            // ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const protectedRoute = path.startsWith("/owner") || path.startsWith("/admin") || path.startsWith("/marketing") || path.startsWith("/account");

  if (protectedRoute && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path + req.nextUrl.search);
    const redirectRes = NextResponse.redirect(url);
    res.headers.forEach((value, key) => redirectRes.headers.set(key, value));
    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: ["/owner/:path*", "/admin/:path*", "/marketing/:path*", "/account/:path*"],
};
