import { getCustomer } from "@/lib/auth";
import { createOrder, OrderInput } from "@/lib/checkout";

export async function POST(request: Request) {
  const parsed = OrderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const customer = await getCustomer();
  const result = await createOrder(parsed.data, customer?.id ?? null);
  return Response.json(result, { status: "error" in result ? 409 : 200 });
}
