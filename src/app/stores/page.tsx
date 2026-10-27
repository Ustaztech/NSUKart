import Link from "next/link";
import { Store } from "lucide-react";
import { Header, Footer } from "@/components/header";
import { configured } from "@/lib/config";
import { db } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Stores() {
  const result = configured()
    ? await (
        await db()
      )
        .from("stores")
        .select("id,name,slug,description")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  return (
    <>
      <Header />
      <main id="main" className="container section">
        <span className="eyebrow">MEET THE MAKERS & SELLERS</span>
        <h1>Small stores. Big possibility.</h1>
        <p>Discover independent businesses in your campus community.</p>
        {result.error ? (
          <p className="notice error">Stores could not be loaded.</p>
        ) : result.data?.length ? (
          <div className="store-grid">
            {result.data.map((s) => (
              <Link
                href={`/stores/${s.slug}`}
                className="store-card"
                key={s.id}
              >
                <Store size={30} />
                <h2>{s.name}</h2>
                <p>{s.description}</p>
                <span className="badge">Platform approved</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Your store could be first.</h2>
            <p>Approved vendors will appear here.</p>
            <Link href="/vendor/apply" className="text-link">
              Apply to sell →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
