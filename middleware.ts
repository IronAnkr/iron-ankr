import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Edge-safe Supabase session refresh + lightweight auth gate
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The rest of this file is for route protection.
  const path = req.nextUrl.pathname;
  
  const debug = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";
  if (debug) {
    // Keep logging extremely light and edge-safe
    console.log("[mw:start]", { path, hasUser: Boolean(user) });
  }

  const isProtectedRoute = /^(?:\/owner|\/admin|\/marketing|\/account)/.test(path);

  if (isProtectedRoute) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path + req.nextUrl.search);
      const redirectRes = NextResponse.redirect(url);
      // preserve any set-cookie headers
      res.headers.forEach((value, key) => redirectRes.headers.set(key, value));
      return redirectRes;
    }
    // Keep authorization minimal here to stay Edge-friendly; deeper checks happen server-side.
  }

  return res;
}

export const config = {
  // Narrow middleware to only protected prefixes to reduce surface
  matcher: ["/owner/:path*", "/admin/:path*", "/marketing/:path*", "/account/:path*"],
};
