import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { uploadImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  if (!rateLimit(`upload:${user.id}`, 60, 10 * 60_000).ok) return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  if (!env.cloudinary.enabled) return NextResponse.json({ error: "Image uploads are not configured. Set CLOUDINARY_* variables, or paste image URLs." }, { status: 503 });
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File).slice(0, 10);
  if (!files.length) return NextResponse.json({ error: "No files received." }, { status: 400 });
  const results: { url: string }[] = [];
  const errors: string[] = [];
  for (const f of files) {
    try { results.push(await uploadImage(f)); } catch (e) { errors.push((e as Error).message); }
  }
  return NextResponse.json({ uploaded: results.map((r) => r.url), errors }, { status: results.length ? 200 : 400 });
}
