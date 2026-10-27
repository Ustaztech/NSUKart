import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import {
  reviewVendor,
  resolveDispute,
  moderateProduct,
  reviewWithdrawal,
  manageAccount,
} from "@/app/actions";
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { client } = await requireUser("admin");
  const section = (await params).section?.join("/") ?? "overview";
  if (
    ![
      "overview",
      "vendors",
      "products",
      "disputes",
      "payments",
      "withdrawals",
      "audit",
      "users",
    ].includes(section)
  )
    notFound();
  const { error } = await searchParams;
  const [
    { data: stores },
    { data: products },
    { data: orders },
    { data: disputes },
    { data: withdrawals },
    { data: audit },
    { data: users },
  ] = await Promise.all([
    client
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("profiles")
      .select("id,full_name,role,suspended")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const paid = orders?.filter((o) => o.payment_status === "paid") ?? [];
  return (
    <DashboardShell role="admin">
      <span className="eyebrow">MARKETPLACE OPERATIONS</span>
      <h1>
        {
          {
            overview: "An overview of your campus.",
            vendors: "Vendor applications.",
            products: "Listing moderation.",
            disputes: "Disputes & support.",
            payments: "Payments & reconciliation.",
            withdrawals: "Withdrawal requests.",
            audit: "Audit trail.",
            users: "Community accounts.",
          }[section]
        }
      </h1>
      {error && <p className="notice error">{error}</p>}
      {section === "overview" && (
        <>
          <p>
            Operational snapshot of the most recent 100 records per category.
          </p>
          <div className="stats-grid">
            <div className="stat">
              <small>Approved stores</small>
              <strong>
                {stores?.filter((s) => s.status === "approved").length ?? 0}
              </strong>
            </div>
            <div className="stat">
              <small>Paid order value (GMV)</small>
              <strong>
                {money(paid.reduce((sum, o) => sum + Number(o.total_kobo), 0))}
              </strong>
            </div>
            <div className="stat">
              <small>Pending applications</small>
              <strong>
                {stores?.filter((s) => s.status === "pending").length ?? 0}
              </strong>
            </div>
          </div>
          <p className="notice">
            GMV is buyer spending, not platform revenue. Refund-required
            payments and withdrawals need operator attention before settlement.
          </p>
        </>
      )}
      {section === "vendors" &&
        (stores?.length ? (
          stores.map((s) => (
            <article className="panel" key={s.id}>
              <h2>{s.name}</h2>
              <span className="badge">{s.status}</span>
              <p>{s.description}</p>
              <p>Pickup: {s.pickup}</p>
              <form action={reviewVendor}>
                <input type="hidden" name="id" value={s.id} />
                <label>
                  Decision
                  <select
                    name="status"
                    defaultValue={
                      s.status === "pending" ? "approved" : s.status
                    }
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="suspended">Suspend</option>
                  </select>
                </label>
                <label>
                  Reason / feedback
                  <textarea name="note" maxLength={1000} required />
                </label>
                <Button>Record decision</Button>
              </form>
            </article>
          ))
        ) : (
          <p className="notice">No applications to review.</p>
        ))}
      {section === "products" && (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{money(p.price_kobo)}</td>
                  <td>{p.status}</td>
                  <td>
                    <form action={moderateProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          p.status === "published" ? "archived" : "published"
                        }
                      />
                      <Button size="sm" variant="outline">
                        {p.status === "published" ? "Archive" : "Publish"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section === "disputes" &&
        (disputes?.length ? (
          disputes.map((d) => (
            <article className="panel" key={d.id}>
              <h2>Dispute {d.id.slice(0, 8)}</h2>
              <span className="badge">{d.status}</span>
              <p>{d.reason}</p>
              <form action={resolveDispute}>
                <input type="hidden" name="id" value={d.id} />
                <label>
                  Status
                  <select name="status">
                    <option value="review">Under review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                <label>
                  Decision and support notes
                  <textarea
                    name="resolution"
                    required
                    minLength={5}
                    defaultValue={d.resolution ?? ""}
                  />
                </label>
                <p>
                  Recording a decision does not execute a refund. Use the
                  provider’s dashboard and reconcile it before reporting money
                  returned.
                </p>
                <Button>Save decision</Button>
              </form>
            </article>
          ))
        ) : (
          <p className="notice">No disputes reported.</p>
        ))}
      {section === "payments" && (
        <div className="panel table-wrap">
          <Link
            className="btn btn-outline"
            href="/api/admin/export"
            prefetch={false}
          >
            Export orders CSV
          </Link>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>State</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id}>
                  <td>{o.payment_reference}</td>
                  <td>{money(o.total_kobo)}</td>
                  <td>{o.payment_status}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section === "withdrawals" && (
        <>
          <p className="notice">
            These requests reserve vendor earnings. A trusted operator must
            verify beneficiary details and execute payouts through an approved
            provider arrangement. Automated payout execution is not enabled.
          </p>
          {withdrawals?.map((w) => (
            <article className="panel" key={w.id}>
              <h2>{money(w.amount_kobo)}</h2>
              <span className="badge">{w.status}</span>
              <p>{w.bank_details}</p>
              <small>Request {w.id}</small>
              {["requested", "processing"].includes(w.status) && (
                <form action={reviewWithdrawal}>
                  <input type="hidden" name="id" value={w.id} />
                  <label>
                    Settlement update
                    <select name="status">
                      {w.status === "requested" ? (
                        <>
                          <option value="processing">
                            Begin operator processing
                          </option>
                          <option value="rejected">
                            Reject and release balance
                          </option>
                        </>
                      ) : (
                        <option value="paid">
                          Record provider-confirmed payout
                        </option>
                      )}
                    </select>
                  </label>
                  {w.status === "processing" && (
                    <label>
                      Verified provider transaction reference
                      <input name="reference" required minLength={5} />
                    </label>
                  )}
                  <p>
                    Record “paid” only after verifying the transfer in the
                    provider dashboard. This action does not send money.
                  </p>
                  <Button>Record settlement update</Button>
                </form>
              )}
            </article>
          ))}
        </>
      )}
      {section === "users" && (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.role}</td>
                  <td>{u.suspended ? "Suspended" : "Active"}</td>
                  <td>
                    {u.role !== "admin" && (
                      <form action={manageAccount}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="suspended"
                          value={String(!u.suspended)}
                        />
                        <Button size="sm" variant="outline">
                          {u.suspended ? "Restore access" : "Suspend"}
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section === "audit" && (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {audit?.map((a) => (
                <tr key={a.id}>
                  <td>{a.action}</td>
                  <td>{a.target_id}</td>
                  <td>
                    {new Date(a.created_at).toLocaleString("en-GB", {
                      timeZone: "Africa/Lagos",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
