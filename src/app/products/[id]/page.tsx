import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShoppingBag, MapPin } from "lucide-react";
import { Header, Footer } from "@/components/header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/supabase/server";
import { configured } from "@/lib/config";
import { money } from "@/lib/utils";
import { addToCart, toggleWishlist } from "@/app/actions";
import { z } from "zod";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!configured() || !z.uuid().safeParse(id).success) notFound();
  const client = await db();
  const [{ data: p }, { data: reviews }] = await Promise.all([
    client
      .from("products")
      .select("*,stores(name,slug,pickup)")
      .eq("id", id)
      .eq("status", "published")
      .single(),
    client
      .from("reviews")
      .select("rating,body,created_at")
      .eq("product_id", id)
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!p) notFound();
  return (
    <>
      <Header />
      <main id="main" className="container">
        <div className="breadcrumb">
          <Link href="/marketplace">Marketplace</Link> / {p.category} /{" "}
          {p.title}
        </div>
        <section className="product-detail">
          <div className="detail-image">
            {p.image_url ? (
              <Image
                src={p.image_url}
                alt={p.title}
                fill
                unoptimized
                sizes="(max-width: 760px) 100vw, 50vw"
              />
            ) : (
              <ShoppingBag size={90} strokeWidth={1} />
            )}
          </div>
          <div className="detail-copy">
            <span className="badge">
              {p.condition} ·{" "}
              {p.kind === "service"
                ? "Service"
                : `${Math.max(0, p.stock - p.reserved)} available`}
            </span>
            <h1>{p.title}</h1>
            <div className="detail-price">{money(p.price_kobo)}</div>
            <p>{p.description}</p>
            <p>
              Sold by{" "}
              <Link href={`/stores/${p.stores.slug}`} className="text-link">
                {p.stores.name} →
              </Link>
            </p>
            <div className="notice">
              <MapPin size={18} /> Campus pickup: {p.stores.pickup}
            </div>
            <form action={addToCart}>
              <input type="hidden" name="product_id" value={p.id} />
              <label>
                Quantity
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                />
              </label>
              <Button
                disabled={p.kind === "product" && p.stock - p.reserved <= 0}
              >
                Add to cart <ShoppingBag size={17} />
              </Button>
            </form>
            <form action={toggleWishlist}>
              <input type="hidden" name="product_id" value={p.id} />
              <Button variant="outline">Save / unsave item</Button>
            </form>
          </div>
        </section>
        <section className="section">
          <h2>From the community.</h2>
          {reviews?.length ? (
            reviews.map((r) => (
              <article key={r.created_at} className="panel">
                <strong>{r.rating} / 5 · Verified purchase</strong>
                <p>{r.body}</p>
              </article>
            ))
          ) : (
            <p>No purchase reviews yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
