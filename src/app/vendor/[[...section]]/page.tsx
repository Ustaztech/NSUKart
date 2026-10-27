import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { OrderList, type OrderRow } from "@/components/order-list";
import { UploadField } from "@/components/upload-field";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import { categories } from "@/lib/catalog";
import { saveProduct, requestWithdrawal } from "@/app/actions";
export default async function Vendor({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client, user } = await requireUser("vendor");
  const section = (await params).section?.join("/") ?? "overview";
  if (!["overview", "products", "orders", "earnings"].includes(section))
    notFound();
  const { error, message } = await searchParams;
  const { data: store } = await client
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single();
  if (!store)
    return (
      <DashboardShell role="vendor">
        <p className="notice">Your account has no vendor store.</p>
      </DashboardShell>
    );
  const [
    { data: products },
    { data: orders, error: orderError },
    { data: ledger },
    { data: withdrawals },
  ] = await Promise.all([
    client
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false }),
    client.rpc("vendor_order_feed"),
    client.from("ledger").select("*").eq("store_id", store.id),
    client
      .from("withdrawals")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false }),
  ]);
  const available =
    ledger?.reduce((sum, r) => sum + Number(r.amount_kobo), 0) ?? 0;
  const rows = (orders ?? []) as OrderRow[];
  return (
    <DashboardShell role="vendor">
      <span className="eyebrow">YOUR VENDOR WORKSPACE</span>
      <h1>
        {section === "overview"
          ? `Hello, ${store.name}.`
          : {
              products: "Your products.",
              orders: "Store orders.",
              earnings: "Your earnings.",
            }[section]}
      </h1>
      {(error || orderError) && (
        <p className="notice error" role="alert">
          {error ?? "Orders could not be loaded."}
        </p>
      )}
      {message && <p className="notice">{message}</p>}
      {store.status !== "approved" && (
        <p className="notice error">
          Your store is {store.status}. New listings and sales are restricted.
        </p>
      )}
      {section === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat">
              <small>Listed products</small>
              <strong>{products?.length ?? 0}</strong>
            </div>
            <div className="stat">
              <small>Paid suborders</small>
              <strong>{rows.length}</strong>
            </div>
            <div className="stat">
              <small>Available earnings</small>
              <strong>{money(available)}</strong>
            </div>
          </div>
          <h2>Recent orders</h2>
          <OrderList rows={rows.slice(0, 5)} vendor />
        </>
      )}
      {section === "products" && (
        <>
          <div className="panel">
            <h2>Add a product or service</h2>
            <form action={saveProduct}>
              <div className="form-grid">
                <label>
                  Title
                  <input name="title" required minLength={3} maxLength={150} />
                </label>
                <label>
                  Category
                  <select name="category">
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (₦)
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  Stock quantity
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue="1"
                    required
                  />
                </label>
                <label>
                  Condition
                  <select name="condition">
                    <option>New</option>
                    <option>Used</option>
                  </select>
                </label>
                <label>
                  Listing type
                  <select name="kind">
                    <option value="product">Physical product</option>
                    <option value="service">Fixed-price service</option>
                  </select>
                </label>
              </div>
              <label>
                Description / service deliverables
                <textarea
                  name="description"
                  minLength={15}
                  required
                  maxLength={5000}
                />
              </label>
              <UploadField />
              <Button disabled={store.status !== "approved"}>
                Publish listing
              </Button>
            </form>
          </div>
          <div className="panel table-wrap">
            <h2>Manage inventory</h2>
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.title}
                      <br />
                      <small>{p.status}</small>
                    </td>
                    <td>{money(p.price_kobo)}</td>
                    <td>{p.stock - p.reserved}</td>
                    <td>
                      <details>
                        <summary>Edit listing</summary>
                        <form action={saveProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="kind" value={p.kind} />
                          <input
                            type="hidden"
                            name="category"
                            value={p.category}
                          />
                          <input
                            type="hidden"
                            name="condition"
                            value={p.condition}
                          />
                          <input
                            type="hidden"
                            name="image_url"
                            value={p.image_url ?? ""}
                          />
                          <label>
                            Title
                            <input
                              name="title"
                              defaultValue={p.title}
                              required
                            />
                          </label>
                          <label>
                            Description
                            <textarea
                              name="description"
                              defaultValue={p.description}
                              required
                            />
                          </label>
                          <label>
                            Price (₦)
                            <input
                              type="number"
                              step="0.01"
                              name="price"
                              defaultValue={p.price_kobo / 100}
                              required
                            />
                          </label>
                          <label>
                            Total stock
                            <input
                              type="number"
                              name="stock"
                              min={p.reserved}
                              defaultValue={p.stock}
                              required
                            />
                          </label>
                          <Button size="sm">Save</Button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {section === "orders" && <OrderList rows={rows} vendor />}
      {section === "earnings" && (
        <>
          <div className="stats-grid">
            <div className="stat">
              <small>Available for withdrawal</small>
              <strong>{money(available)}</strong>
            </div>
            <div className="stat">
              <small>Completed net sales</small>
              <strong>
                {money(
                  ledger
                    ?.filter((r) => r.kind === "sale")
                    .reduce((sum, r) => sum + Number(r.amount_kobo), 0) ?? 0,
                )}
              </strong>
            </div>
            <div className="stat">
              <small>Withdrawal requests</small>
              <strong>{withdrawals?.length ?? 0}</strong>
            </div>
          </div>
          <p className="notice">
            Earnings become available only after buyer-confirmed completion.
            This is an accounting balance, not a regulated wallet. Payout
            execution is an operator-assisted process in this release.
          </p>
          <div className="panel">
            <h2>Request a withdrawal</h2>
            <form action={requestWithdrawal}>
              <label>
                Amount (₦)
                <input
                  name="amount"
                  type="number"
                  min="100"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Bank name, account name and account number
                <textarea
                  name="bank"
                  required
                  minLength={10}
                  maxLength={1000}
                />
              </label>
              <Button>Submit withdrawal request</Button>
            </form>
          </div>
          <div className="panel">
            <h2>Withdrawal history</h2>
            {withdrawals?.length ? (
              withdrawals.map((w) => (
                <p key={w.id}>
                  {money(w.amount_kobo)} · {w.status}
                </p>
              ))
            ) : (
              <p>No withdrawal requests.</p>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
