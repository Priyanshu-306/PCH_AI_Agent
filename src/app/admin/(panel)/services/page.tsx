import Link from "next/link";
import { asc } from "drizzle-orm";
import { FileSpreadsheet, Plus } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { inr, minutesLabel } from "@/lib/format";
import { Badge, Btn, Card, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Services & courses" };

export default async function ServicesAdmin() {
  await requireStaff("services");
  const rows = await db.select().from(services).orderBy(asc(services.sort));
  return (
    <>
      <PageHeader title="Services & courses" subtitle="Healing sessions, certification courses, webinars and workshops." actions={<><Btn href="/admin/services/import" variant="ghost"><FileSpreadsheet className="size-4" />Import Excel</Btn><Btn href="/admin/services/new"><Plus className="size-4" />Add</Btn></>} />
      <Card pad={false}>
        <Table head={["Name", "Type", "Duration", "Price", "Booking", "Status"]}>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-lavender-50/50">
              <td><Link href={`/admin/services/${s.id}`} className="flex items-center gap-2 font-semibold text-plum-900 hover:underline"><span className="size-3 rounded-full" style={{ background: s.accent }} />{s.nameEn}</Link></td>
              <td className="capitalize">{s.type}</td>
              <td>{minutesLabel(s.durationMinutes) || "—"}</td>
              <td className="tabular-nums">{s.price != null ? inr(s.price) : "On request"}</td>
              <td>{s.bookableOnline ? <Badge tone="green">online booking</Badge> : <Badge>enquiry</Badge>}</td>
              <td><Badge tone={s.active ? "green" : "gray"}>{s.active ? "visible" : "hidden"}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
