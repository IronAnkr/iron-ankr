import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Prepare a passthrough response and attach updated auth cookies to it.
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

  // Refresh the auth session cookie; essential for auth to work in middleware.
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

  const isProtectedRoute = /^\/(owner|admin|marketing|account)/.test(path);

  if (isProtectedRoute) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path + req.nextUrl.search);
      // Ensure any Set-Cookie headers from Supabase are preserved on redirect
      const redirectRes = NextResponse.redirect(url);
      res.headers.forEach((value, key) => redirectRes.headers.set(key, value));
      return redirectRes;
    }

    // Fetch global app role and team roles (with team slugs) for authorization checks.
    const [{ data: appUserRow }, { data: teamRows }] = await Promise.all([
      supabase.from("app_users").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("team_members")
        .select("role, teams(slug,name)")
        .eq("user_id", user.id),
    ]);

    const siteRole = appUserRow?.role as string | undefined;
    const isSiteOwner = siteRole === "owner";
    const isSiteAdmin = siteRole === "admin" || isSiteOwner;

    type TeamRow = { role: "owner"|"admin"|"marketing"|"member"; teams: { slug: string | null; name: string | null } | null };
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

    let isAuthorized = false;
    if (path.startsWith("/owner")) {
      isAuthorized = isSiteOwner;
    } else if (path.startsWith("/admin")) {
      // Admin dashboard for global site admins/owner or members of the 'admin' team with admin/owner role
      isAuthorized = isSiteAdmin || hasAdminTeamAdmin;
    } else if (path.startsWith("/marketing")) {
      // Marketing dashboard for global site admins/owner or members of the 'marketing' team with marketing/admin/owner
      isAuthorized = isSiteAdmin || hasMarketingTeamRole;
    } else if (path.startsWith("/account")) {
      isAuthorized = true; // All logged-in users can access their account.
    }

    if (!isAuthorized) {
      const url = req.nextUrl.clone();
      url.pathname = "/403"; // Forbidden page.
      const redirectRes = NextResponse.redirect(url);
      res.headers.forEach((value, key) => redirectRes.headers.set(key, value));
      return redirectRes;
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
