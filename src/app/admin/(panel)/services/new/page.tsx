import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ServiceForm from "@/components/admin/ServiceForm";

export const metadata = { title: "Add service" };

export default async function NewService() {
  await requireStaff("services");
  return (<><PageHeader title="Add service or course" /><ServiceForm /></>);
}
