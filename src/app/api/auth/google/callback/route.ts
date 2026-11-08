import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { exchangeGoogleCode } from "@/lib/auth/google";
import { createSession, safeNext } from "@/lib/auth/session";
import { safeEqual } from "@/lib/auth/tokens";
import { logActivity } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const fail = (code = "google") => NextResponse.redirect(new URL(`/login?error=${code}`, env.appUrl));
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("g_state")?.value;
  const verifier = req.cookies.get("g_verifier")?.value;
  if (!env.google.enabled || !code || !state || !savedState || !verifier || !safeEqual(state, savedState)) return fail();

  try {
    const profile = await exchangeGoogleCode(code, verifier);
    if (!profile.email_verified) return fail("google_unverified");
    const email = profile.email.toLowerCase();
    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: profile.sub }, { email }] } });
    if (user && !user.isActive) return fail("suspended");
    if (!user) {
      user = await prisma.user.create({ data: { email, name: profile.name ?? email.split("@")[0], googleId: profile.sub, avatarUrl: profile.picture, emailVerified: new Date() } });
      await logActivity(user.id, "auth.register_google");
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.sub, emailVerified: user.emailVerified ?? new Date() } });
    }
    await createSession(user.id);
    await logActivity(user.id, "auth.login_google");
    const res = NextResponse.redirect(new URL(safeNext(req.cookies.get("g_next")?.value, user.role === "ADMIN" ? "/admin" : "/dashboard"), env.appUrl));
    for (const c of ["g_state", "g_verifier", "g_next"]) res.cookies.delete({ name: c, path: "/api/auth/google" });
    return res;
  } catch (err) {
    console.error("[google]", err);
    return fail();
  }
}
