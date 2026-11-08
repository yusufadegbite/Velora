import { NextResponse, type NextRequest } from "next/server";

/** Fast edge gate: bounce visitors without a session cookie. Real authorisation happens server-side. */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("velora_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*"] };
