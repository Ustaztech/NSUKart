import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/supabase/admin";
import { validCron } from "@/lib/security";
import { verifyPayment } from "@/lib/paystack";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!validCron(request.headers.get("authorization"), process.env.CRON_SECRET))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = adminDb();
  let payments = 0,
    emails = 0;
  // Verify first, then expire reservations. Failed provider checks leave an auditable late-payment path.
  if (process.env.PAYSTACK_SECRET_KEY) {
    const { data: orders, error } = await client
      .from("orders")
      .select("payment_reference")
      .in("payment_status", ["pending", "expired"])
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(20);
    if (error)
      return NextResponse.json(
        { error: "Reconciliation query failed" },
        { status: 500 },
      );
    for (const o of orders ?? []) {
      try {
        if ((await verifyPayment(o.payment_reference)) === "paid") payments++;
      } catch {
        /* Retry next run. */
      } finally {
        await client
          .from("orders")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("payment_reference", o.payment_reference);
      }
    }
  }
  const { error: expiryError } = await client.rpc("expire_reservations");
  if (expiryError)
    return NextResponse.json(
      { error: "Reservation expiry failed" },
      { status: 500 },
    );
  if (process.env.RESEND_API_KEY) {
    const emailFrom = process.env.EMAIL_FROM || "NSUKart <onboarding@resend.dev>";
    const { data: jobs, error } = await client.rpc("claim_email_jobs");
    if (error)
      return NextResponse.json(
        { error: "Email queue unavailable" },
        { status: 500 },
      );
    const resend = new Resend(process.env.RESEND_API_KEY);
    for (const job of jobs ?? []) {
      try {
        const {
          data: { user },
          error: authError,
        } = await client.auth.admin.getUserById(job.user_id);
        if (authError || !user?.email) throw new Error("Recipient unavailable");
        const result = await resend.emails.send(
          {
            from: emailFrom,
            to: user.email,
            subject: job.subject,
            text: `${job.body}\n\nYour Campus. Your Marketplace.\nNSUKart`,
          },
          { idempotencyKey: `email/${job.id}` },
        );
        if (result.error) throw new Error("Delivery failed");
        const { error: updateError } = await client
          .from("email_jobs")
          .update({ state: "sent", locked_until: null })
          .eq("id", job.id);
        if (updateError) throw updateError;
        emails++;
      } catch {
        await client
          .from("email_jobs")
          .update({
            state: job.attempts >= 5 ? "failed" : "pending",
            available_at: new Date(
              Date.now() + Math.pow(2, job.attempts) * 60000,
            ).toISOString(),
            locked_until: null,
          })
          .eq("id", job.id);
      }
    }
  }
  return NextResponse.json({ payments, emails });
}
