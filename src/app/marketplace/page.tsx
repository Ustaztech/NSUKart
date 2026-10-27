import Link from "next/link";
import { Header, Footer } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { catalog, categories } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { products, error, ...pagination } = await catalog({ ...params, page: params.page ?? "1" });
  const page = pagination.page ?? 1;
  const totalPages = pagination.totalPages ?? 0;
  const total = pagination.total ?? 0;
  function pageHref(target: number) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
    query.set("page", String(target));
    return `/marketplace?${query.toString()}`;
  }
  return (
    <>
      <Header />
      <main id="main" className="container section">
        <div className="page-intro">
          <span className="eyebrow">THE CAMPUS MARKETPLACE</span>
          <h1>Find your kind of good.</h1>
          <p>
            Discover essentials, little upgrades, and your next favourite
            student business.
          </p>
        </div>
        <form className="filter-bar">
          <label>
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={params.q}
              placeholder="What are you looking for?"
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select name="category" defaultValue={params.category ?? ""}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort</span>
            <select name="sort" defaultValue={params.sort ?? "newest"}>
              <option value="newest">Newest first</option>
              <option value="price">Price: low to high</option>
            </select>
          </label>
          <Button>Apply filters</Button>
        </form>
        {!error && total > 0 && (
          <p className="muted" aria-live="polite">{total} listing{total === 1 ? "" : "s"} found · Page {page} of {totalPages}</p>
        )}
        {error ? (
          <p role="alert" className="notice error">
            {error}
          </p>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No listings found.</h2>
            <p>
              Try a different search or check back when vendors publish new
              products.
            </p>
          </div>
        )}
        {!error && totalPages > 1 && (
          <nav aria-label="Marketplace pages" className="pagination" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginTop: "2rem" }}>
            {page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}
            <span>Page {page} of {totalPages}</span>
            {page < totalPages && <Link href={pageHref(page + 1)}>Next →</Link>}
          </nav>
        )}
      </main>
      <Footer />
    </>
  );
}
