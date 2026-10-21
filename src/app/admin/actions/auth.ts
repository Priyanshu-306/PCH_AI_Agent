"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { checkPassword, endStaffSession, getStaff, startStaffSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { FormState } from "@/app/actions/public";

export async function loginStaff(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(staff).where(eq(staff.email, email));
  if (!user || !user.active || !(await checkPassword(password, user.passwordHash))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "Incorrect email or password" };
  }
  await startStaffSession(user.id);
  await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, user.id));
  await audit(user, { action: "login", entity: "staff", entityId: user.id, summary: `${user.name} signed in` });
  redirect("/admin");
}

export async function logoutStaff() {
  const user = await getStaff();
  if (user) await audit(user, { action: "login", entity: "staff", entityId: user.id, summary: `${user.name} signed out` });
  await endStaffSession();
  redirect("/admin/login");
}
