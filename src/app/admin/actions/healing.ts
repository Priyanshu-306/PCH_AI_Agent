"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { availability, blockedDates, bookings, courseBatches, enquiries, services, testimonials, trainers } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/format";
import { emailLayout, escapeHtml, sendEmail, sendWhatsApp } from "@/lib/notify";

const opt = (v: FormDataEntryValue | null) => (v == null || String(v).trim() === "" ? null : String(v).trim());
const numOrNull = (v: FormDataEntryValue | null) => (opt(v) == null ? null : Number(v));

/* ------------------------------------------------------------------ Services */

const Service = z.object({
  code: z.string().trim().min(1, "Code is required").max(40),
  type: z.enum(["session", "course", "webinar", "workshop"]),
  nameEn: z.string().trim().min(1, "Name is required"),
  shortEn: z.string().default(""),
  descriptionEn: z.string().default(""),
  helpsWith: z.string().default(""),
  mode: z.enum(["online", "onsite", "both"]),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i).default("#9b7fd4"),
  sort: z.coerce.number().int().default(0),
});

export async function saveService(form: FormData) {
  const user = await requireStaff("services");
  const id = Number(form.get("id")) || null;
  const back = id ? `/admin/services/${id}` : "/admin/services/new";
  const parsed = Service.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`${back}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const values = {
    ...parsed.data,
    slug: slugify(opt(form.get("slug")) ?? parsed.data.nameEn),
    nameHi: opt(form.get("nameHi")),
    shortHi: opt(form.get("shortHi")),
    descriptionHi: opt(form.get("descriptionHi")),
    durationMinutes: numOrNull(form.get("durationMinutes")),
    price: numOrNull(form.get("price")),
    trainerId: numOrNull(form.get("trainerId")),
    bookableOnline: form.get("bookableOnline") === "on",
    active: form.get("active") === "on",
    image: opt(form.get("image")),
    video: opt(form.get("video")),
  };
  let savedId = id;
  if (id) {
    const [before] = await db.select().from(services).where(eq(services.id, id));
    const [after] = await db.update(services).set(values).where(eq(services.id, id)).returning();
    await audit(user, { action: "update", entity: "service", entityId: id, summary: `Updated ${after.type} ${after.nameEn}`, before, after });
  } else {
    const [c] = await db.insert(services).values(values).returning();
    savedId = c.id;
    await audit(user, { action: "create", entity: "service", entityId: c.id, summary: `Added ${c.type} ${c.nameEn}`, after: c });
  }
  redirect(`/admin/services/${savedId}?saved=1`);
}

export async function deleteService(form: FormData) {
  const user = await requireStaff("services");
  const [before] = await db.delete(services).where(eq(services.id, Number(form.get("id")))).returning();
  if (before) await audit(user, { action: "delete", entity: "service", entityId: before.id, summary: `Deleted ${before.type} ${before.nameEn}`, before });
  redirect("/admin/services?saved=Deleted");
}

export async function saveBatch(form: FormData) {
  const user = await requireStaff("services");
  const serviceId = Number(form.get("serviceId"));
  const id = Number(form.get("id")) || null;
  const startsOn = opt(form.get("startsOn"));
  if (!startsOn) redirect(`/admin/services/${serviceId}?error=Start%20date%20is%20required`);
  const values = {
    serviceId,
    startsOn,
    endsOn: opt(form.get("endsOn")),
    timing: opt(form.get("timing")),
    location: opt(form.get("location")),
    mode: (opt(form.get("mode")) ?? "onsite") as "onsite",
    seats: numOrNull(form.get("seats")),
    fee: numOrNull(form.get("fee")),
    note: opt(form.get("note")),
  };
  if (id) {
    const [before] = await db.select().from(courseBatches).where(eq(courseBatches.id, id));
    const [after] = await db.update(courseBatches).set(values).where(eq(courseBatches.id, id)).returning();
    await audit(user, { action: "update", entity: "batch", entityId: id, summary: `Updated batch starting ${startsOn}`, before, after });
  } else {
    const [c] = await db.insert(courseBatches).values(values).returning();
    await audit(user, { action: "create", entity: "batch", entityId: c.id, summary: `Added batch starting ${startsOn}`, after: c });
  }
  redirect(`/admin/services/${serviceId}?saved=1#batches`);
}

export async function deleteBatch(form: FormData) {
  const user = await requireStaff("services");
  const [b] = await db.delete(courseBatches).where(eq(courseBatches.id, Number(form.get("id")))).returning();
  if (b) await audit(user, { action: "delete", entity: "batch", entityId: b.id, summary: `Deleted batch starting ${b.startsOn}`, before: b });
  redirect(`/admin/services/${b?.serviceId ?? ""}?saved=1#batches`);
}

/* ------------------------------------------------------------------ Bookings & availability */

export async function updateBooking(form: FormData) {
  const user = await requireStaff("bookings");
  const id = Number(form.get("id"));
  const [before] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!before) redirect("/admin/bookings");
  const status = String(form.get("status")) as typeof before.status;
  const values = { status, paymentStatus: String(form.get("paymentStatus")) as typeof before.paymentStatus, adminNotes: opt(form.get("adminNotes")) };
  const meeting = opt(form.get("meetingLink"));
  const [after] = await db.update(bookings).set(values).where(eq(bookings.id, id)).returning();
  await audit(user, { action: "update", entity: "booking", entityId: id, summary: `Booking ${after.number}: ${before.status} → ${status}`, before, after });
  if (meeting) {
    await Promise.allSettled([
      sendEmail({ to: after.email, kind: "booking", subject: `Joining link — ${after.serviceName}`, html: emailLayout("Your session link", `<p>Dear ${escapeHtml(after.name)},</p><p>Here is your link for ${escapeHtml(after.serviceName)}:</p><p><a href="${escapeHtml(meeting)}">${escapeHtml(meeting)}</a></p>`) }),
      sendWhatsApp({ to: after.phone, kind: "booking", text: `Namaste ${after.name}, your session link: ${meeting} — Pure Conscious Healing` }),
    ]);
  }
  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function saveAvailability(form: FormData) {
  const user = await requireStaff("bookings");
  const before = await db.select().from(availability);
  const rows: { weekday: number; startTime: string; endTime: string }[] = [];
  for (let d = 0; d < 7; d++) {
    const starts = form.getAll(`start_${d}`).map(String);
    const ends = form.getAll(`end_${d}`).map(String);
    starts.forEach((s, i) => {
      if (/^\d{2}:\d{2}$/.test(s) && /^\d{2}:\d{2}$/.test(ends[i] ?? "") && s < ends[i]) rows.push({ weekday: d, startTime: s, endTime: ends[i] });
    });
  }
  await db.transaction(async (tx) => {
    await tx.delete(availability);
    if (rows.length) await tx.insert(availability).values(rows);
  });
  await audit(user, { action: "update", entity: "availability", summary: `Updated weekly availability (${rows.length} time windows)`, before, after: rows });
  redirect("/admin/bookings/availability?saved=1");
}

export async function blockDate(form: FormData) {
  const user = await requireStaff("bookings");
  const day = opt(form.get("day"));
  if (day) {
    await db.insert(blockedDates).values({ day, reason: opt(form.get("reason")) }).onConflictDoNothing();
    await audit(user, { action: "create", entity: "availability", summary: `Blocked ${day} for bookings` });
  }
  redirect("/admin/bookings/availability?saved=1");
}

export async function unblockDate(form: FormData) {
  const user = await requireStaff("bookings");
  const [b] = await db.delete(blockedDates).where(eq(blockedDates.id, Number(form.get("id")))).returning();
  if (b) await audit(user, { action: "delete", entity: "availability", summary: `Re-opened ${b.day} for bookings` });
  redirect("/admin/bookings/availability?saved=1");
}

/* ------------------------------------------------------------------ Enquiries, trainers, testimonials */

export async function setEnquiryStatus(form: FormData) {
  const user = await requireStaff("enquiries");
  const id = Number(form.get("id"));
  const status = String(form.get("status")) as "new";
  const [before] = await db.select().from(enquiries).where(eq(enquiries.id, id));
  const [after] = await db.update(enquiries).set({ status }).where(eq(enquiries.id, id)).returning();
  await audit(user, { action: "status", entity: "enquiry", entityId: id, summary: `Enquiry from ${after.name} marked ${status}`, before, after });
  revalidatePath("/admin/enquiries");
}

export async function saveTrainer(form: FormData) {
  const user = await requireStaff("trainers");
  const id = Number(form.get("id")) || null;
  const name = opt(form.get("name"));
  if (!name) redirect("/admin/trainers?error=Name%20is%20required");
  const values = {
    name,
    slug: slugify(name),
    titleEn: opt(form.get("titleEn")) ?? "",
    titleHi: opt(form.get("titleHi")),
    bioEn: opt(form.get("bioEn")) ?? "",
    bioHi: opt(form.get("bioHi")),
    credentials: opt(form.get("credentials")) ?? "",
    photo: opt(form.get("photo")),
    isFounder: form.get("isFounder") === "on",
    active: form.get("active") === "on",
    sort: Number(form.get("sort") ?? 0),
  };
  if (id) {
    const [before] = await db.select().from(trainers).where(eq(trainers.id, id));
    const [after] = await db.update(trainers).set(values).where(eq(trainers.id, id)).returning();
    await audit(user, { action: "update", entity: "trainer", entityId: id, summary: `Updated trainer ${name}`, before, after });
  } else {
    const [c] = await db.insert(trainers).values(values).returning();
    await audit(user, { action: "create", entity: "trainer", entityId: c.id, summary: `Added trainer ${name}`, after: c });
  }
  redirect("/admin/trainers?saved=1");
}

export async function deleteTrainer(form: FormData) {
  const user = await requireStaff("trainers");
  const [b] = await db.delete(trainers).where(eq(trainers.id, Number(form.get("id")))).returning();
  if (b) await audit(user, { action: "delete", entity: "trainer", entityId: b.id, summary: `Deleted trainer ${b.name}`, before: b });
  redirect("/admin/trainers?saved=Deleted");
}

export async function saveTestimonial(form: FormData) {
  const user = await requireStaff("testimonials");
  const id = Number(form.get("id")) || null;
  const name = opt(form.get("name"));
  const textEn = opt(form.get("textEn"));
  if (!name || !textEn) redirect("/admin/testimonials?error=Name%20and%20text%20are%20required");
  const values = {
    site: (opt(form.get("site")) ?? "healing") as string,
    name,
    location: opt(form.get("location")),
    textEn,
    textHi: opt(form.get("textHi")),
    rating: Number(form.get("rating") ?? 5),
    photo: opt(form.get("photo")),
    serviceId: numOrNull(form.get("serviceId")),
    featured: form.get("featured") === "on",
    active: form.get("active") === "on",
  };
  if (id) {
    const [before] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    const [after] = await db.update(testimonials).set(values).where(eq(testimonials.id, id)).returning();
    await audit(user, { action: "update", entity: "testimonial", entityId: id, summary: `Updated testimonial from ${name}`, before, after });
  } else {
    const [c] = await db.insert(testimonials).values(values).returning();
    await audit(user, { action: "create", entity: "testimonial", entityId: c.id, summary: `Added testimonial from ${name}`, after: c });
  }
  redirect("/admin/testimonials?saved=1");
}

export async function deleteTestimonial(form: FormData) {
  const user = await requireStaff("testimonials");
  const [b] = await db.delete(testimonials).where(eq(testimonials.id, Number(form.get("id")))).returning();
  if (b) await audit(user, { action: "delete", entity: "testimonial", entityId: b.id, summary: `Deleted testimonial from ${b.name}`, before: b });
  redirect("/admin/testimonials?saved=Deleted");
}
