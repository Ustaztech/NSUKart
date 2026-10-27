import Link from "next/link";
import { Header, Footer } from "@/components/header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import { removeCartItem, checkout } from "@/app/actions";
export default async function Cart({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { client, user } = await requireUser();
  const { error: message } = await searchParams;
  const { data: items, error } = await client
    .from("cart_items")
    .select("id,quantity,products(title,price_kobo,stores(name))")
    .eq("buyer_id", user.id);
  const total =
    items?.reduce(
      (n, i) =>
        n +
        ((i.products as unknown as { price_kobo: number } | null)?.price_kobo ??
          0) *
          i.quantity,
      0,
    ) ?? 0;
  return (
    <>
      <Header />
      <main id="main" className="container section">
        <span className="eyebrow">YOUR NEXT GOOD FIND</span>
        <h1>Your shopping bag.</h1>
        {(error || message) && (
          <p className="notice error">
            {message ?? "Your cart could not be loaded."}
          </p>
        )}
        {items?.length ? (
          <div className="cart-layout">
            <div>
              {items.map((i) => {
                const p = i.products as unknown as {
                  title: string;
                  price_kobo: number;
                  stores: { name: string };
                } | null;
                return (
                  <article className="cart-row" key={i.id}>
                    <div>
                      <h3>{p?.title ?? "Unavailable product"}</h3>
                      <p>
                        {p?.stores?.name} · Quantity {i.quantity}
                      </p>
                    </div>
                    <strong>{money((p?.price_kobo ?? 0) * i.quantity)}</strong>
                    <form action={removeCartItem}>
                      <input name="id" type="hidden" value={i.id} />
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </article>
                );
              })}
            </div>
            <aside className="panel">
              <h2>Order summary</h2>
              <p>Campus pickup · grouped by vendor</p>
              <strong>{money(total)}</strong>
              <p>Stock and prices are checked again at checkout.</p>
              <form action={checkout}>
                <Button>Proceed to checkout →</Button>
              </form>
            </aside>
          </div>
        ) : (
          <div className="empty-state">
            <h2>A little room for something good.</h2>
            <p>Your bag is empty.</p>
            <Button asChild>
              <Link href="/marketplace">Explore marketplace</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
