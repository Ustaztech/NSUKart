import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { csvCell } from "@/lib/utils";
export async function GET() {
  const { client } = await requireUser("admin");
  const { data, error } = await client
    .from("orders")
    .select("id,total_kobo,payment_status,created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  const rows = [
    ["Order ID", "Amount (kobo)", "Payment status", "Created at"],
    ...(data ?? []).map((o) => [
      o.id,
      o.total_kobo,
      o.payment_status,
      o.created_at,
    ]),
  ];
  return new NextResponse(
    rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nsukart-orders.csv"',
        "Cache-Control": "private, no-store",
      },
    },
  );
}
