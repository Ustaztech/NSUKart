import { Button } from "./ui/button";
import { money } from "@/lib/utils";
import {
  fulfilOrder,
  sendMessage,
  openDispute,
  createReview,
} from "@/app/actions";
export type OrderRow = {
  id: string;
  order_id: string;
  status: string;
  subtotal_kobo: number;
  pickup_snapshot: string;
  pickup_code: string;
  stores: { name: string } | null;
  order_items: {
    id: string;
    title: string;
    quantity: number;
    unit_kobo: number;
    product_id: string;
  }[];
  messages: { id: string; body: string; created_at: string }[];
};
export function OrderList({
  rows,
  vendor = false,
  paidIds,
}: {
  rows: OrderRow[];
  vendor?: boolean;
  paidIds?: Set<string>;
}) {
  return rows.length ? (
    rows.map((v) => {
      const paid = vendor || paidIds?.has(v.order_id);
      return (
        <article className="panel order-card" key={v.id}>
          <div className="order-header">
            <div>
              <h2>{v.stores?.name ?? "Store order"}</h2>
              <small>Order {v.order_id.slice(0, 8).toUpperCase()}</small>
            </div>
            <span className="badge">
              {paid ? v.status : "Payment pending / unavailable"}
            </span>
            <strong>{money(v.subtotal_kobo)}</strong>
          </div>
          <ul className="order-items">
            {v.order_items.map((i) => (
              <li key={i.id}>
                {i.title} × {i.quantity} — {money(i.unit_kobo * i.quantity)}
              </li>
            ))}
          </ul>
          <p>Pickup: {v.pickup_snapshot}</p>
          {paid && vendor && ["pending", "accepted"].includes(v.status) && (
            <form action={fulfilOrder}>
              <input type="hidden" name="id" value={v.id} />
              <input
                type="hidden"
                name="status"
                value={v.status === "pending" ? "accepted" : "ready"}
              />
              <Button>
                {v.status === "pending"
                  ? "Accept order"
                  : "Mark ready for pickup"}
              </Button>
            </form>
          )}
          {paid && !vendor && v.status === "ready" && (
            <div className="notice">
              <p>
                Your confirmation code: <strong>{v.pickup_code}</strong>.
                Confirm only after receiving your items.
              </p>
              <form action={fulfilOrder}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="status" value="completed" />
                <label>
                  Enter the pickup code
                  <input name="code" required autoComplete="off" />
                </label>
                <Button>Confirm received</Button>
              </form>
            </div>
          )}
          <details>
            <summary>Order messages ({v.messages.length})</summary>
            {v.messages.map((m) => (
              <p className="message" key={m.id}>
                {m.body}
              </p>
            ))}
            <form action={sendMessage}>
              <input type="hidden" name="id" value={v.id} />
              <label>
                Message
                <textarea name="body" required maxLength={2000} />
              </label>
              <Button size="sm">Send message</Button>
            </form>
          </details>
          {paid && !vendor && v.status !== "completed" && (
            <details>
              <summary>Report a problem</summary>
              <form action={openDispute}>
                <input type="hidden" name="id" value={v.id} />
                <label>
                  Describe the issue
                  <textarea
                    name="reason"
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                </label>
                <Button variant="outline">Open dispute</Button>
              </form>
            </details>
          )}
          {paid && !vendor && v.status === "completed" && (
            <details>
              <summary>Review your purchase</summary>
              {v.order_items.map((i) => (
                <form action={createReview} key={i.id}>
                  <h3>{i.title}</h3>
                  <input type="hidden" name="order_item_id" value={i.id} />
                  <input type="hidden" name="product_id" value={i.product_id} />
                  <label>
                    Rating
                    <select name="rating">
                      <option value="5">5 — Excellent</option>
                      <option value="4">4 — Good</option>
                      <option value="3">3 — Average</option>
                      <option value="2">2 — Poor</option>
                      <option value="1">1 — Very poor</option>
                    </select>
                  </label>
                  <label>
                    Review
                    <textarea
                      name="body"
                      required
                      minLength={3}
                      maxLength={2000}
                    />
                  </label>
                  <Button size="sm">Submit review</Button>
                </form>
              ))}
            </details>
          )}
        </article>
      );
    })
  ) : (
    <div className="empty-state">
      <h2>No orders here yet.</h2>
      <p>Your purchases and their progress will appear here.</p>
    </div>
  );
}
