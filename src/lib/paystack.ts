import "server-only";
import { required } from "./config";
import { adminDb } from "./supabase/admin";
export async function paystack(path: string, body?: unknown) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${required("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || !result.status)
    throw new Error("Payment provider request failed");
  return result.data;
}
export async function verifyPayment(reference: string) {
  const result = await paystack(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  if (result.reference !== reference || result.status !== "success")
    return "pending";
  const { data, error } = await adminDb().rpc("confirm_payment", {
    p_reference: reference,
    p_amount: result.amount,
    p_currency: result.currency,
  });
  if (error) throw new Error("Payment could not be reconciled");
  return data as string;
}
