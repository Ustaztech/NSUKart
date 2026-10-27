import { NextRequest, NextResponse } from "next/server";
import { validSignature } from "@/lib/security";
import { verifyPayment } from "@/lib/paystack";
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret)
    return NextResponse.json(
      { error: "Payment integration unavailable" },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > 65536)
    return new NextResponse(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > 65536) return new NextResponse(null, { status: 413 });
  if (!validSignature(raw, request.headers.get("x-paystack-signature"), secret))
    return new NextResponse(null, { status: 401 });
  try {
    const event = JSON.parse(raw);
    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (typeof reference !== "string" || reference.length > 100)
        return new NextResponse(null, { status: 400 });
      await verifyPayment(reference);
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed; retry required" },
      { status: 500 },
    );
  }
}
