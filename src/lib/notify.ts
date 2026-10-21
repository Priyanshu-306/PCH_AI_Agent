import "server-only";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { notifications } from "@/db/schema";

type Kind = "order" | "booking" | "enquiry" | "review" | "stock" | "system";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function mailer() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

/** Sends an email, or records it in Admin › Notifications when SMTP is not configured. */
export async function sendEmail(opts: { to: string; subject: string; html: string; kind: Kind; link?: string }) {
  const m = mailer();
  let status = "logged";
  let error: string | null = null;
  if (m) {
    try {
      await m.sendMail({ from: process.env.MAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html });
      status = "sent";
    } catch (e) {
      status = "failed";
      error = String(e);
    }
  }
  await db.insert(notifications).values({
    channel: "email",
    kind: opts.kind,
    recipient: opts.to,
    title: opts.subject,
    body: opts.html,
    link: opts.link,
    status,
    error,
  });
}

/**
 * WhatsApp Business API. Providers differ only in endpoint and payload, so each is a small adapter.
 * Without WHATSAPP_PROVIDER the message is recorded in Admin › Notifications instead.
 */
export async function sendWhatsApp(opts: { to: string; text: string; kind: Kind; link?: string }) {
  const provider = process.env.WHATSAPP_PROVIDER;
  const apiKey = process.env.WHATSAPP_API_KEY;
  const to = opts.to.replace(/\D/g, "");
  let status = "logged";
  let error: string | null = null;
  if (provider && apiKey && to) {
    try {
      let res: Response;
      if (provider === "meta") {
        res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: opts.text } }),
        });
      } else if (provider === "interakt") {
        res = await fetch("https://api.interakt.ai/v1/public/message/", {
          method: "POST",
          headers: { Authorization: `Basic ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fullPhoneNumber: to, type: "Text", data: { message: opts.text } }),
        });
      } else {
        // gupshup
        res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
          method: "POST",
          headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            channel: "whatsapp",
            source: process.env.WHATSAPP_PHONE_ID ?? "",
            destination: to,
            message: JSON.stringify({ type: "text", text: opts.text }),
          }),
        });
      }
      status = res.ok ? "sent" : "failed";
      if (!res.ok) error = `${res.status} ${await res.text()}`.slice(0, 500);
    } catch (e) {
      status = "failed";
      error = String(e);
    }
  }
  await db.insert(notifications).values({
    channel: "whatsapp",
    kind: opts.kind,
    recipient: to || null,
    title: opts.text.split("\n")[0].slice(0, 200),
    body: opts.text,
    link: opts.link,
    status,
    error,
  });
}

/** Alert the owner on every channel: admin bell, email and WhatsApp. */
export async function notifyOwner(opts: { kind: Kind; title: string; body: string; link?: string }) {
  await db.insert(notifications).values({ channel: "in_app", kind: opts.kind, title: opts.title, body: opts.body, link: opts.link });
  const jobs: Promise<unknown>[] = [];
  if (process.env.OWNER_EMAIL)
    jobs.push(
      sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: opts.title,
        html: emailLayout(opts.title, `<p>${escapeHtml(opts.body).replace(/\n/g, "<br>")}</p>`),
        kind: opts.kind,
        link: opts.link,
      }),
    );
  if (process.env.OWNER_WHATSAPP)
    jobs.push(sendWhatsApp({ to: process.env.OWNER_WHATSAPP, text: `${opts.title}\n${opts.body}`, kind: opts.kind, link: opts.link }));
  await Promise.allSettled(jobs);
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function emailLayout(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f2fb;font-family:Arial,sans-serif;color:#2a2140">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#5b3e8c,#9b7fd4);padding:24px;color:#fff">
      <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:.8">Pure Conscious Healing</div>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:600">${escapeHtml(title)}</h1>
    </div>
    <div style="padding:24px;font-size:15px;line-height:1.6">${inner}</div>
    <div style="padding:16px 24px;background:#faf7f2;font-size:12px;color:#7a6f8a">With love and light — Pure Conscious Healing &amp; Pure Crystal Hub</div>
  </div></body></html>`;
}
