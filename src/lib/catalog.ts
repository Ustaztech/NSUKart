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
    page?: string;
  } = {},
) {
  if (!configured()) return { products: [] as Product[], error: null };
  const client = await db();
  const paginated = filters.page !== undefined;
  const parsedPage = Number(filters.page);
  const page = paginated && Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 10000) : 1;
  const pageSize = 24;
  let query = client
    .from("products")
    .select("*, stores(name,slug,status)", { count: paginated ? "exact" : undefined })
    .eq("status", "published");
  if (filters.q)
    query = query.ilike(
      "title",
      `%${filters.q.replace(/[%_\\]/g, "").slice(0, 100)}%`,
    );
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  query = paginated ? query.range((page - 1) * pageSize, page * pageSize - 1) : query.limit(60);
  const { data, error, count } = await query.order(
    filters.sort === "price" ? "price_kobo" : "created_at",
    { ascending: filters.sort === "price" },
  );
  return {
    products: (data ?? []) as Product[],
    ...(paginated ? { page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) } : {}),
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
