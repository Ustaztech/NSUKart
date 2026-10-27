import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateProfile, readNotifications } from "@/app/actions";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { OrderList, type OrderRow } from "@/components/order-list";
import { ProductCard } from "@/components/product-card";
import { requireUser } from "@/lib/auth";
import type { Product } from "@/lib/types";
export default async function Dashboard({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { client, user, profile } = await requireUser();
  const section = (await params).section?.join("/") ?? "overview";
  const { error } = await searchParams;
  if (
    !["overview", "orders", "wishlist", "notifications", "account"].includes(
      section,
    )
  )
    notFound();
  const [
    { data: orders, error: orderError },
    { data: saved },
    { data: notifications },
  ] = await Promise.all([
    client
      .from("orders")
      .select(
        "*,vendor_orders(*,stores(name),order_items(*),messages(id,body,created_at))",
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    client
      .from("wishlist")
      .select("products(*,stores(name,slug,status))")
      .eq("buyer_id", user.id),
    client
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const paidIds = new Set<string>(
    (orders ?? []).filter((o) => o.payment_status === "paid").map((o) => o.id),
  );
  const rows = (orders ?? []).flatMap(
    (o) => o.vendor_orders,
  ) as unknown as OrderRow[];
  return (
    <DashboardShell>
      <span className="eyebrow">YOUR CAMPUS CORNER</span>
      <h1>
        {section === "overview"
          ? `Welcome back, ${profile.full_name.split(" ")[0] || "friend"}.`
          : {
              orders: "My orders.",
              wishlist: "Your saved finds.",
              notifications: "Your updates.",
              account: "Your account.",
            }[section]}
      </h1>
      {(error || orderError) && (
        <p role="alert" className="notice error">
          {error ?? "Orders could not be loaded. Please retry."}
        </p>
      )}
      {section === "overview" && (
        <>
          <p>Good finds and campus connections, all in one place.</p>
          <div className="stats-grid">
            <div className="stat">
              <small>Paid orders</small>
              <strong>{paidIds.size}</strong>
            </div>
            <div className="stat">
              <small>Saved items</small>
              <strong>{saved?.length ?? 0}</strong>
            </div>
            <div className="stat">
              <small>Completed pickups</small>
              <strong>
                {rows.filter((v) => v.status === "completed").length}
              </strong>
            </div>
          </div>
          {profile.role === "vendor" && (
            <p className="notice">
              <Link href="/vendor">Open your vendor dashboard →</Link>
            </p>
          )}
          {profile.role === "admin" && (
            <p className="notice">
              <Link href="/admin">Open the administrator dashboard →</Link>
            </p>
          )}
          <h2>Recent orders</h2>
          <OrderList rows={rows.slice(0, 3)} paidIds={paidIds} />
        </>
      )}
      {section === "orders" && (
        <>
          {orders
            ?.filter((o) => o.payment_status === "pending")
            .map((o) => (
              <p className="notice" key={o.id}>
                Order {o.id.slice(0, 8)} is awaiting payment.{" "}
                <Link href={`/checkout?order=${o.id}`}>
                  Continue checkout →
                </Link>
              </p>
            ))}
          {orders
            ?.filter((o) =>
              ["expired", "refund_required"].includes(o.payment_status),
            )
            .map((o) => (
              <p className="notice error" key={o.id}>
                Order {o.id.slice(0, 8)}:{" "}
                {o.payment_status === "expired"
                  ? "Reservation expired. Add the items to your cart again."
                  : "Payment requires support review and a refund."}
              </p>
            ))}
          <OrderList rows={rows} paidIds={paidIds} />
        </>
      )}
      {section === "wishlist" &&
        (saved?.length ? (
          <div className="product-grid">
            {saved.map((w, index) =>
              w.products ? (
                <ProductCard
                  key={index}
                  product={w.products as unknown as Product}
                />
              ) : null,
            )}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Save something you love.</h2>
            <p>Use “Save item” on a product to keep it here.</p>
            <Link href="/marketplace">Browse the marketplace →</Link>
          </div>
        ))}
      {section === "notifications" && (
        <form action={readNotifications}>
          <Button variant="outline">Mark all as read</Button>
        </form>
      )}
      {section === "notifications" &&
        (notifications?.length ? (
          notifications.map((n) => (
            <article className="panel" key={n.id}>
              <h2>{n.title}</h2>
              <p>{n.body}</p>
              <small>
                {new Date(n.created_at).toLocaleDateString("en-GB")}
              </small>
            </article>
          ))
        ) : (
          <p className="notice">You’re all caught up.</p>
        ))}
      {section === "account" && (
        <div className="panel">
          <h2>{profile.full_name}</h2>
          <form action={updateProfile}>
            <label>
              Full name
              <input
                name="full_name"
                defaultValue={profile.full_name}
                required
                minLength={2}
              />
            </label>
            <label>
              Phone
              <input name="phone" defaultValue={profile.phone} required />
            </label>
            <Button>Save profile</Button>
          </form>
          <p>{user.email}</p>
          <p>{profile.phone}</p>
          <span className="badge">{profile.role}</span>
          <p>
            Your matriculation number is private and does not represent
            university verification.
          </p>
          <Link className="text-link" href="/reset-password">
            Reset password →
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
