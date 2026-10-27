import { NextRequest, NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/config";
import { paystack } from "@/lib/paystack";
import { adminDb } from "@/lib/supabase/admin";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(appUrl()).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { client, user } = await requireUser();
  if (!(await allowRequest("payment", 5)))
    return NextResponse.json(
      { error: "Please wait a minute before trying again" },
      { status: 429 },
    );
  const form = await request.formData();
  const id = z.uuid().safeParse(form.get("order_id"));
  if (!id.success)
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  const { data: o } = await client
    .from("orders")
    .select("*")
    .eq("id", id.data)
    .eq("buyer_id", user.id)
    .eq("payment_status", "pending")
    .single();
  if (!o || new Date(o.expires_at) <= new Date())
    return NextResponse.json(
      { error: "Order reservation expired. Return to your cart." },
      { status: 409 },
    );
  try {
    if (o.checkout_url) {
      const existing = new URL(o.checkout_url);
      if (
        existing.protocol === "https:" &&
        existing.hostname === "checkout.paystack.com"
      )
        return NextResponse.redirect(existing, 303);
    }
    const payment = await paystack("/transaction/initialize", {
      email: user.email,
      amount: o.total_kobo,
      currency: "NGN",
      reference: o.payment_reference,
      callback_url: `${appUrl()}/api/payments/callback`,
    });
    const url = new URL(payment.authorization_url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com")
      throw new Error("Unexpected checkout URL");
    const { error: saveError } = await adminDb()
      .from("orders")
      .update({ checkout_url: url.toString() })
      .eq("id", o.id)
      .eq("payment_status", "pending");
    if (saveError) throw saveError;
    return NextResponse.redirect(url, 303);
  } catch {
    return NextResponse.redirect(
      new URL(
        `/checkout?order=${o.id}&error=Payment+could+not+be+started.+Please+try+again.`,
        appUrl(),
      ),
      303,
    );
  }
}
