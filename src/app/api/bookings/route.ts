import { BookingInput, createBooking } from "@/lib/checkout";

export async function POST(request: Request) {
  const parsed = BookingInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const result = await createBooking(parsed.data);
  return Response.json(result, { status: "error" in result ? 409 : 200 });
}
