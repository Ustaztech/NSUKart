import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import { z } from "zod";
export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; error?: string }>;
}) {
  const { client, user } = await requireUser();
  const params = await searchParams;
  if (!z.uuid().safeParse(params.order).success) notFound();
  const { data: o } = await client
    .from("orders")
    .select("*,vendor_orders(*,order_items(*),stores(name))")
    .eq("id", params.order)
    .eq("buyer_id", user.id)
    .single();
  if (!o) notFound();
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <span className="eyebrow">ONE MORE STEP</span>
        <h1>Complete your checkout.</h1>
        {params.error && <p className="notice error">{params.error}</p>}
        <p>
          Order {o.id.slice(0, 8).toUpperCase()} ·{" "}
          <span className="badge">{o.payment_status}</span>
        </p>
        {o.vendor_orders.map(
          (v: {
            id: string;
            stores: { name: string };
            pickup_snapshot: string;
            order_items: {
              id: string;
              title: string;
              quantity: number;
              unit_kobo: number;
            }[];
          }) => (
            <article className="panel" key={v.id}>
              <h2>{v.stores.name}</h2>
              {v.order_items.map((i) => (
                <p key={i.id}>
                  {i.title} × {i.quantity} — {money(i.unit_kobo * i.quantity)}
                </p>
              ))}
              <small>Pickup: {v.pickup_snapshot}</small>
            </article>
          ),
        )}
        <div className="panel">
          <h2>Total: {money(o.total_kobo)}</h2>
          <p>
            Your reservation expires at{" "}
            {new Date(o.expires_at).toLocaleString("en-GB", {
              timeZone: "Africa/Lagos",
            })}{" "}
            WAT.
          </p>
          {o.payment_status === "pending" ? (
            <form method="post" action="/api/payments/initialize">
              <input type="hidden" name="order_id" value={o.id} />
              <Button disabled={!process.env.PAYSTACK_SECRET_KEY}>
                Pay securely with Paystack →
              </Button>
              {!process.env.PAYSTACK_SECRET_KEY && (
                <p className="notice">
                  Payment configuration is pending. No charge has been made.
                </p>
              )}
            </form>
          ) : (
            <p>View this order in your dashboard for its current status.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
