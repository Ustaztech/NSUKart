import "server-only";
import { db } from "./supabase/server";
export async function allowRequest(
  bucket: "checkout" | "upload" | "message" | "payment",
  max: number,
) {
  const client = await db();
  const { data, error } = await client.rpc("consume_limit", {
    p_bucket: bucket,
    p_max: max,
  });
  return !error && data === true;
}
