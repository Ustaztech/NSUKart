import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/config";
import { verifyPayment } from "@/lib/paystack";
export async function GET(request: NextRequest) {
  const { client, user } = await requireUser();
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference || reference.length > 100)
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  const { data: o } = await client
    .from("orders")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("payment_reference", reference)
    .single();
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await verifyPayment(reference);
  } catch {
    /* Reconciliation jobs will retry. The UI still displays persisted pending state. */
  }
  return NextResponse.redirect(new URL("/dashboard/orders", appUrl()));
}
