import { Header, Footer } from "@/components/header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { applyVendor } from "@/app/actions";
export default async function Apply({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client, user } = await requireUser();
  const { error, message } = await searchParams;
  const { data: s } = await client
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <span className="eyebrow">YOUR HUSTLE, YOUR STOREFRONT</span>
        <h1>Build something on campus.</h1>
        <p>
          Tell us about your store. Administrators review applications before
          products can go live.
        </p>
        {error && <p className="notice error">{error}</p>}
        {message && <p className="notice">{message}</p>}
        {s ? (
          <div className="panel">
            <h2>{s.name}</h2>
            <span className="badge">{s.status}</span>
            <p>{s.review_note ?? "Your application status is shown above."}</p>
          </div>
        ) : (
          <form action={applyVendor} className="panel">
            <label>
              Store name
              <input name="name" required minLength={2} maxLength={100} />
            </label>
            <label>
              Store URL slug
              <input
                name="slug"
                placeholder="campus-essentials"
                pattern="[a-z0-9-]{3,100}"
                required
              />
            </label>
            <label>
              What do you sell?
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={2000}
              />
            </label>
            <label>
              Campus pickup information
              <textarea name="pickup" required minLength={5} maxLength={500} />
            </label>
            <p>
              Default platform commission: 5% of completed orders. Gateway
              settlement and payout fees must be confirmed by the operator
              before launch.
            </p>
            <Button>Submit vendor application →</Button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
