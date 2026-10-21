import { requireStaff } from "@/lib/auth";
import { Btn, Card, PageHeader } from "@/components/admin/ui";
import ImportForm from "@/components/admin/ImportForm";

export const metadata = { title: "Import services" };

export default async function ImportServices() {
  await requireStaff("services");
  return (
    <>
      <PageHeader title="Import services from Excel" subtitle="Uses the Services tab of the template. Rows are matched by code." actions={<Btn href="/PCH_Import_Template.xlsx" variant="ghost">Download template</Btn>} />
      <Card><ImportForm kind="services" /></Card>
    </>
  );
}
