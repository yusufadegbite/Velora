import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { generateToken } from "@/lib/auth/tokens";
import { googleAuthUrl, pkceChallenge } from "@/lib/auth/google";
import { safeNext } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  if (!env.google.enabled) return NextResponse.redirect(new URL("/login?error=google", env.appUrl));
  const state = generateToken(24);
  const verifier = generateToken(48);
  const res = NextResponse.redirect(googleAuthUrl(state, await pkceChallenge(verifier)));
  const opts = { httpOnly: true, secure: env.isProd, sameSite: "lax" as const, path: "/api/auth/google", maxAge: 600 };
  res.cookies.set("g_state", state, opts);
  res.cookies.set("g_verifier", verifier, opts);
  res.cookies.set("g_next", safeNext(req.nextUrl.searchParams.get("next")), opts);
  return res;
}
