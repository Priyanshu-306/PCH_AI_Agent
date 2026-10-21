import "server-only";
import { and, asc, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, courseBatches, products, services, testimonials, trainers } from "@/db/schema";
import { istDay } from "./format";

export const sessionServices = () =>
  db.select().from(services).where(and(eq(services.active, true), eq(services.type, "session"))).orderBy(asc(services.sort));

export const learningServices = () =>
  db.select().from(services).where(and(eq(services.active, true), ne(services.type, "session"))).orderBy(asc(services.sort));

export async function serviceBySlug(slug: string) {
  const [s] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.active, true)));
  if (!s) return null;
  const [trainer] = s.trainerId ? await db.select().from(trainers).where(eq(trainers.id, s.trainerId)) : [];
  return { ...s, trainer: trainer ?? null };
}

export const activeTrainers = () => db.select().from(trainers).where(eq(trainers.active, true)).orderBy(asc(trainers.sort));

export const upcomingBatches = (serviceIds?: number[]) =>
  db
    .select()
    .from(courseBatches)
    .where(and(gte(courseBatches.startsOn, istDay()), serviceIds ? inArray(courseBatches.serviceId, serviceIds.length ? serviceIds : [-1]) : undefined))
    .orderBy(asc(courseBatches.startsOn));

export const siteTestimonials = (site: "healing" | "shop", serviceId?: number) =>
  db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.site, site), eq(testimonials.active, true), serviceId ? eq(testimonials.serviceId, serviceId) : undefined))
    .orderBy(desc(testimonials.featured), desc(testimonials.createdAt));

export const featuredProducts = (limit = 8) =>
  db
    .select({ p: products, category: categories.nameEn })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "active"), eq(products.isFeatured, true)))
    .orderBy(desc(products.updatedAt))
    .limit(limit);
