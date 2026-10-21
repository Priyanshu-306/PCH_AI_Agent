"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { addresses, customers, wishlist } from "@/db/schema";
import { checkPassword, endCustomerSession, getCustomer, hashPassword, startCustomerSession } from "@/lib/auth";
import type { FormState } from "./public";

const Register = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function registerCustomer(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Register.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const [exists] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, parsed.data.email));
  if (exists) return { error: "An account with this email already exists. Please log in." };
  const [c] = await db
    .insert(customers)
    .values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash: await hashPassword(parsed.data.password) })
    .returning();
  await startCustomerSession(c.id);
  redirect(String(form.get("next") || "/account"));
}

export async function loginCustomer(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [c] = await db.select().from(customers).where(eq(customers.email, email));
  if (!c || !(await checkPassword(password, c.passwordHash))) return { error: "Incorrect email or password" };
  await startCustomerSession(c.id);
  redirect(String(form.get("next") || "/account"));
}

export async function logoutCustomer() {
  await endCustomerSession();
  redirect("/");
}

export async function toggleWishlist(productId: number) {
  const c = await getCustomer();
  if (!c) return { login: true };
  const where = and(eq(wishlist.customerId, c.id), eq(wishlist.productId, productId));
  const [row] = await db.select().from(wishlist).where(where);
  if (row) await db.delete(wishlist).where(where);
  else await db.insert(wishlist).values({ customerId: c.id, productId });
  revalidatePath("/wishlist");
  return { saved: !row };
}

const Address = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  line1: z.string().trim().min(3),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
});

export async function saveAddress(_: FormState, form: FormData): Promise<FormState> {
  const c = await getCustomer();
  if (!c) return { error: "Please log in" };
  const parsed = Address.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.customerId, c.id));
  await db.insert(addresses).values({ ...parsed.data, customerId: c.id, isDefault: existing.length === 0 });
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddress(id: number) {
  const c = await getCustomer();
  if (!c) return;
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, c.id)));
  revalidatePath("/account");
}
