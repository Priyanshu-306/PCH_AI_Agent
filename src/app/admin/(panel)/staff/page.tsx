import { asc } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, ROLE_PERMISSIONS, type Role } from "@/lib/permissions";
import { fmtDateTime } from "@/lib/format";
import { saveStaff } from "@/app/admin/actions/system";
import { Badge, Card, Field, PageHeader, Table, input } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Staff & roles" };

export default async function StaffPage() {
  const me = await requireStaff("staff");
  const rows = await db.select().from(staff).orderBy(asc(staff.createdAt));
  const roles = Object.keys(ROLE_LABELS) as Role[];
  return (
    <>
      <PageHeader title="Staff & roles" subtitle="Give team members their own login with only the access they need." />
      <Card title="Roles" className="mb-6">
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          {roles.map((r) => <li key={r}><b>{ROLE_LABELS[r]}</b><span className="block text-xs text-ink-soft">{ROLE_PERMISSIONS[r].join(", ")}</span></li>)}
        </ul>
      </Card>
      <Card pad={false} className="mb-6">
        <Table head={["Name", "Email", "Role", "Last sign-in", "Status", ""]}>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="font-semibold">{s.name}{s.id === me.id && <span className="ml-1 text-xs text-ink-soft">(you)</span>}</td>
              <td>{s.email}</td>
              <td>{ROLE_LABELS[s.role]}</td>
              <td className="text-xs">{s.lastLoginAt ? fmtDateTime(s.lastLoginAt) : "Never"}</td>
              <td><Badge tone={s.active ? "green" : "gray"}>{s.active ? "active" : "disabled"}</Badge></td>
              <td>
                <details>
                  <summary className="cursor-pointer text-xs font-semibold text-plum-700">Edit</summary>
                  <form action={saveStaff} className="mt-3 grid w-[min(80vw,560px)] gap-3 rounded-xl border border-lavender-200 p-4 sm:grid-cols-2">
                    <input type="hidden" name="id" value={s.id} />
                    <Field label="Name"><input name="name" defaultValue={s.name} className={input} /></Field>
                    <Field label="Email"><input name="email" type="email" defaultValue={s.email} className={input} /></Field>
                    <Field label="Role"><select name="role" defaultValue={s.role} className={input}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></Field>
                    <Field label="New password" hint="Leave blank to keep"><input name="password" type="password" autoComplete="new-password" className={input} /></Field>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="active" defaultChecked={s.active} className="size-4 accent-[#5b3e8c]" /> Account active</label>
                    <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
                  </form>
                </details>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Add staff member">
        <form action={saveStaff} className="grid gap-3 sm:grid-cols-4">
          <Field label="Name"><input name="name" required className={input} /></Field>
          <Field label="Email"><input name="email" type="email" required className={input} /></Field>
          <Field label="Role"><select name="role" defaultValue="content_editor" className={input}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></Field>
          <Field label="Temporary password"><input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} /></Field>
          <input type="hidden" name="active" value="on" />
          <div className="sm:col-span-4"><SubmitButton>Add staff</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
