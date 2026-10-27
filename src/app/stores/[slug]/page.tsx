import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { db } from "@/lib/supabase/server";
import { configured } from "@/lib/config";
import { catalog } from "@/lib/catalog";
export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!configured()) notFound();
  const { slug } = await params;
  const client = await db();
  const { data: store } = await client
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();
  if (!store) notFound();
  const { products } = await catalog({ storeId: store.id });
  return (
    <>
      <Header />
      <main id="main" className="container section">
        <section className="store-hero">
          <span className="badge">Platform approved vendor</span>
          <h1>{store.name}</h1>
          <p>{store.description}</p>
          <small>Pickup: {store.pickup}</small>
        </section>
        <h2>In this store.</h2>
        {products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>This store has no published listings yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
