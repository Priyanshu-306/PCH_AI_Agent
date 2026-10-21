"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contentBlocks, marketingSpend, media, notifications, settings, staff } from "@/db/schema";
import { hashPassword, requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { CONTENT } from "@/lib/content-registry";
import { SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import { deleteUpload } from "@/lib/media";

/* ------------------------------------------------------------------ Content */

export async function saveContent(form: FormData) {
  const user = await requireStaff("content");
  const site = String(form.get("site"));
  const section = String(form.get("section"));
  const defs = CONTENT.filter((c) => c.site === site && c.section === section);
  const changes: string[] = [];
  for (const def of defs) {
    const en = form.get(`${def.key}::en`);
    const hi = form.get(`${def.key}::hi`);
    if (en == null) continue;
    const [before] = await db.select().from(contentBlocks).where(eq(contentBlocks.key, def.key));
    const valueEn = String(en);
    const valueHi = hi == null ? (before?.valueHi ?? null) : String(hi) || null;
    if (before && before.valueEn === valueEn && (before.valueHi ?? null) === valueHi) continue;
    const row = { key: def.key, site: def.site, section: def.section, label: def.label, kind: def.kind, valueEn, valueHi };
    await db.insert(contentBlocks).values(row).onConflictDoUpdate({ target: contentBlocks.key, set: { valueEn, valueHi } });
    changes.push(def.label);
    await audit(user, { action: "update", entity: "content", entityId: def.key, summary: `Edited ${site} › ${section} › ${def.label}`, before: before ? { valueEn: before.valueEn, valueHi: before.valueHi } : null, after: { valueEn, valueHi } });
  }
  revalidatePath("/", "layout");
  redirect(`/admin/content?site=${site}&section=${encodeURIComponent(section)}&saved=${encodeURIComponent(changes.length ? `Saved ${changes.length} change(s)` : "No changes")}`);
}

/* ------------------------------------------------------------------ Media */

export async function deleteMedia(form: FormData) {
  const user = await requireStaff("media");
  const [m] = await db.delete(media).where(eq(media.id, Number(form.get("id")))).returning();
  if (m) {
    await deleteUpload(m.filename);
    await audit(user, { action: "delete", entity: "media", entityId: m.id, summary: `Deleted file ${m.originalName}`, before: m });
  }
  redirect("/admin/media?saved=File%20deleted");
}

/* ------------------------------------------------------------------ Marketing */

const Spend = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  brand: z.enum(["healing", "shop", "both"]),
  channel: z.string().trim().min(1).max(60),
  campaign: z.string().trim().max(160).optional(),
  amount: z.coerce.number().positive(),
  notes: z.string().trim().max(1000).optional(),
});

export async function addSpend(form: FormData) {
  const user = await requireStaff("marketing");
  const parsed = Spend.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/admin/marketing?error=${encodeURIComponent(parsed.error.issues[0].path + ": " + parsed.error.issues[0].message)}`);
  const [row] = await db.insert(marketingSpend).values({ ...parsed.data, createdBy: user.id }).returning();
  await audit(user, { action: "create", entity: "marketing", entityId: row.id, summary: `Logged ₹${row.amount} on ${row.channel}${row.campaign ? ` (${row.campaign})` : ""}`, after: row });
  redirect("/admin/marketing?saved=1");
}

export async function deleteSpend(form: FormData) {
  const user = await requireStaff("marketing");
  const [row] = await db.delete(marketingSpend).where(eq(marketingSpend.id, Number(form.get("id")))).returning();
  if (row) await audit(user, { action: "delete", entity: "marketing", entityId: row.id, summary: `Removed spend ₹${row.amount} on ${row.channel}`, before: row });
  redirect("/admin/marketing?saved=1");
}

/* ------------------------------------------------------------------ Notifications */

export async function markAllRead() {
  await requireStaff();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.channel, "in_app"), isNull(notifications.readAt)));
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ Staff */

const Staff = z.object({
  name: z.string().trim().min(2),
  email: z.email().transform((e) => e.toLowerCase()),
  role: z.enum(["owner", "shop_manager", "bookings_manager", "content_editor"]),
});

export async function saveStaff(form: FormData) {
  const user = await requireStaff("staff");
  const id = Number(form.get("id")) || null;
  const parsed = Staff.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/admin/staff?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const password = String(form.get("password") ?? "");
  if (!id && password.length < 8) redirect("/admin/staff?error=Password%20must%20be%20at%20least%208%20characters");
  if (id === user.id && parsed.data.role !== "owner") redirect("/admin/staff?error=You%20cannot%20remove%20your%20own%20owner%20role");
  const values = { ...parsed.data, active: id === user.id ? true : form.get("active") === "on", ...(password ? { passwordHash: await hashPassword(password) } : {}) };
  if (id) {
    const [before] = await db.select().from(staff).where(eq(staff.id, id));
    const [after] = await db.update(staff).set(values).where(eq(staff.id, id)).returning();
    await audit(user, { action: "update", entity: "staff", entityId: id, summary: `Updated staff ${after.name} (${after.role})${password ? ", password reset" : ""}`, before, after });
  } else {
    const [c] = await db.insert(staff).values(values as typeof values & { passwordHash: string }).onConflictDoNothing().returning();
    if (!c) redirect("/admin/staff?error=That%20email%20already%20has%20an%20account");
    await audit(user, { action: "create", entity: "staff", entityId: c.id, summary: `Added staff ${c.name} as ${c.role}`, after: c });
  }
  redirect("/admin/staff?saved=1");
}

/* ------------------------------------------------------------------ Settings */

export async function saveSettings(form: FormData) {
  const user = await requireStaff("settings");
  const key = String(form.get("key")) as SettingKey;
  const defaults = SETTING_DEFAULTS[key] as Record<string, unknown>;
  if (!defaults) redirect("/admin/settings?error=Unknown%20settings");
  const value: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(defaults)) {
    const raw = form.get(k);
    value[k] = typeof def === "boolean" ? raw === "on" : typeof def === "number" ? Number(raw ?? def) : String(raw ?? "");
  }
  const [before] = await db.select().from(settings).where(eq(settings.key, key));
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  await audit(user, { action: "update", entity: "settings", entityId: key, summary: `Updated ${key} settings`, before: before?.value ?? defaults, after: value });
  revalidatePath("/", "layout");
  redirect(`/admin/settings?saved=1#${key}`);
}
