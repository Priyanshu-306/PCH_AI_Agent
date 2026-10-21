import { getStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { exportProducts } from "@/lib/excel";
import { audit } from "@/lib/audit";
import { istDay } from "@/lib/format";

export async function GET() {
  const user = await getStaff();
  if (!user || !can(user.role, "products")) return new Response("Unauthorized", { status: 401 });
  const buf = await exportProducts();
  await audit(user, { action: "export", entity: "product", summary: "Exported product catalogue to Excel" });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pure-crystal-hub-products-${istDay()}.xlsx"`,
    },
  });
}
