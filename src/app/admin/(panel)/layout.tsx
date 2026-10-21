import { Suspense } from "react";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { HEALING_URL, SHOP_URL } from "@/lib/site";
import { logoutStaff } from "@/app/admin/actions/auth";
import Sidebar from "@/components/admin/Sidebar";
import Toast from "@/components/admin/Toast";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · PCH Admin" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.channel, "in_app"), isNull(notifications.readAt)));
  return (
    <div className="min-h-screen bg-[#f8f6fc] text-ink">
      <Sidebar perms={[...ROLE_PERMISSIONS[user.role]]} user={{ name: user.name, role: ROLE_LABELS[user.role] }} unread={n} healingUrl={HEALING_URL} shopUrl={SHOP_URL} logout={logoutStaff} />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
