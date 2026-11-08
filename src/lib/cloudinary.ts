import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Check magic bytes so a renamed file can't masquerade as an image. */
export function sniffImage(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

/** Signed server-side upload to Cloudinary. */
export async function uploadImage(file: File, folder = "velora/vehicles") {
  if (!env.cloudinary.enabled) throw new Error("Image uploads are not configured. Set the CLOUDINARY_* variables or paste image URLs instead.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} is larger than 8 MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) throw new Error(`${file.name} is not a JPEG, PNG, WebP or AVIF image`);

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${env.cloudinary.apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), file.name);
  form.append("api_key", env.cloudinary.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Image upload failed");
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}
