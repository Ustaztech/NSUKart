import "server-only";
import { db } from "./supabase/server";
import { configured } from "./config";
import type { Product } from "./types";
export async function catalog(
  filters: {
    q?: string;
    category?: string;
    sort?: string;
    storeId?: string;
  } = {},
) {
  if (!configured()) return { products: [] as Product[], error: null };
  const client = await db();
  let query = client
    .from("products")
    .select("*, stores(name,slug,status)")
    .eq("status", "published")
    .limit(60);
  if (filters.q)
    query = query.ilike(
      "title",
      `%${filters.q.replace(/[%_\\]/g, "").slice(0, 100)}%`,
    );
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  const { data, error } = await query.order(
    filters.sort === "price" ? "price_kobo" : "created_at",
    { ascending: filters.sort === "price" },
  );
  return {
    products: (data ?? []) as Product[],
    error: error
      ? "The catalogue could not be loaded. Please try again."
      : null,
  };
}
export const categories = [
  "Textbooks",
  "Electronics",
  "Fashion",
  "Hostel Essentials",
  "Food & Groceries",
  "Digital Services",
];
