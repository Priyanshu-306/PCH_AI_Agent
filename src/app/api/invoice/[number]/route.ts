import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCustomer, getStaff } from "@/lib/auth";
import { accessToken } from "@/lib/checkout";
import { renderInvoice } from "@/lib/invoice";

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const token = new URL(request.url).searchParams.get("t");
  let allowed = token === accessToken(number) || Boolean(await getStaff());
  if (!allowed) {
    const customer = await getCustomer();
    const [o] = await db.select({ customerId: orders.customerId }).from(orders).where(eq(orders.number, number));
    allowed = Boolean(customer && o && o.customerId === customer.id);
  }
  if (!allowed) return new Response("Not allowed", { status: 403 });
  const pdf = await renderInvoice(number);
  if (!pdf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="invoice-${number}.pdf"` },
  });
}
