import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, staff } from "@/db/schema";
import { can, type Permission } from "./permissions";

const STAFF_COOKIE = "pch_staff";
const CUSTOMER_COOKIE = "pch_customer";
const MAX_AGE = 60 * 60 * 24 * 7;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || secret.includes("change-me")))
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters in production");
  return new TextEncoder().encode(secret || "dev-secret-change-me");
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

async function sign(sub: number, kind: "staff" | "customer") {
  return new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(sub))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

async function readSubject(cookieName: string, kind: "staff" | "customer") {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.kind === kind && payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

async function setCookie(name: string, value: string) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIES,
    path: "/",
    maxAge: MAX_AGE,
  });
}

/* ---------------------------------------------------------------- Staff */

export async function startStaffSession(id: number) {
  await setCookie(STAFF_COOKIE, await sign(id, "staff"));
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

export const getStaff = cache(async () => {
  const id = await readSubject(STAFF_COOKIE, "staff");
  if (!id) return null;
  const [user] = await db.select().from(staff).where(eq(staff.id, id));
  return user && user.active ? user : null;
});

export type StaffUser = NonNullable<Awaited<ReturnType<typeof getStaff>>>;

/** Use at the top of every admin page and server action. */
export async function requireStaff(permission?: Permission) {
  const user = await getStaff();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?denied=" + permission);
  return user;
}

/* ---------------------------------------------------------------- Customers */

export async function startCustomerSession(id: number) {
  await setCookie(CUSTOMER_COOKIE, await sign(id, "customer"));
}

export async function endCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export const getCustomer = cache(async () => {
  const id = await readSubject(CUSTOMER_COOKIE, "customer");
  if (!id) return null;
  const [c] = await db
    .select({ id: customers.id, name: customers.name, email: customers.email, phone: customers.phone })
    .from(customers)
    .where(eq(customers.id, id));
  return c ?? null;
});
