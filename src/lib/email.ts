import "server-only";
import { env } from "@/lib/env";
import { site } from "@/lib/site";

type Mail = { to: string; subject: string; heading: string; lines: string[]; cta?: { label: string; href: string } };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render({ heading, lines, cta }: Mail) {
  return `<!doctype html><html><body style="margin:0;background:#F4F3EF;font-family:Helvetica,Arial,sans-serif;color:#10151C">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;max-width:560px">
  <tr><td style="background:#10151C;padding:24px 32px;color:#C49A5A;letter-spacing:6px;font-weight:700;font-size:18px">VELORA</td></tr>
  <tr><td style="padding:32px"><h1 style="font-size:22px;margin:0 0 16px">${esc(heading)}</h1>
  ${lines.map((l) => `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;color:#334">${esc(l)}</p>`).join("")}
  ${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.href)}" style="background:#C49A5A;color:#10151C;padding:12px 22px;text-decoration:none;font-weight:600">${esc(cta.label)}</a></p>` : ""}
  </td></tr><tr><td style="padding:20px 32px;border-top:1px solid #eee;font-size:12px;color:#697586">${esc(site.name)} · ${esc(site.tagline)} · ${esc(site.address)}</td></tr>
  </table></td></tr></table></body></html>`;
}

/**
 * Sends transactional email through Resend when RESEND_API_KEY is set.
 * Otherwise the message is logged to the server console (development mode) — it is NOT reported as delivered.
 * Email failures never break the business transaction that triggered them.
 */
export async function sendEmail(mail: Mail): Promise<{ delivered: boolean }> {
  if (!env.resend.apiKey) {
    console.info(`[email:dev] To: ${mail.to} | ${mail.subject}\n  ${mail.lines.join("\n  ")}${mail.cta ? `\n  → ${mail.cta.href}` : ""}`);
    return { delivered: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resend.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.resend.from, to: [mail.to], subject: mail.subject, html: render(mail) }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
    return { delivered: res.ok };
  } catch (err) {
    console.error("[email] send failed", err);
    return { delivered: false };
  }
}
