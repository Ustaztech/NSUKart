import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Headphones,
  Shirt,
  Armchair,
  ShieldCheck,
  MapPin,
  Store,
  ArrowRight,
} from "lucide-react";
import { Header, Footer } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { catalog } from "@/lib/catalog";
import { configured } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { products, error } = await catalog();
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span />
              BUILT FOR CAMPUS LIFE
            </span>
            <h1>
              Good finds.
              <br />
              Great <span>campus</span>
              <br />
              connections.
            </h1>
            <p>
              Textbooks, tech, everyday essentials — discover what you need,
              from people in your university community.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/marketplace">
                  Explore marketplace <ArrowUpRight size={19} />
                </Link>
              </Button>
              <Link href="/vendor/apply" className="text-link">
                Open your store <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <ShieldCheck size={17} />
              Approved vendors <span>•</span>
              <MapPin size={17} /> Campus pickup
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustrated campus shopping essentials"
          >
            <div className="art-orbit" />
            <div className="art-label">
              THE CAMPUS EDIT <span>01 / NSUK</span>
            </div>
            <div className="art-book book-one">
              THE
              <br />
              NEXT
              <br />
              CHAPTER<span>YOUR STORY STARTS HERE</span>
            </div>
            <div className="art-book book-two">
              STUDY
              <br />
              SMART.
            </div>
            <div className="art-bag">
              <div className="bag-handle" />
              <span>N</span>
            </div>
            <div className="floating-label">
              <ShieldCheck size={23} />
              <div>
                Made for your campus<small>Discover. Connect. Trade.</small>
              </div>
            </div>
            <div className="art-caption">
              EVERYDAY FINDS. STUDENT POSSIBILITIES.
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div className="container">
            <span>
              <ShieldCheck />
              Vendor approval
            </span>
            <span>
              <MapPin />
              Convenient campus pickup
            </span>
            <span>
              <Store />
              Support student businesses
            </span>
          </div>
        </section>
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIND YOUR EVERYDAY</span>
              <h2>A little of everything.</h2>
            </div>
            <Link href="/marketplace">
              All categories <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="category-grid">
            {[
              { name: "Textbooks", icon: BookOpen, color: "peach" },
              { name: "Electronics", icon: Headphones, color: "sage" },
              { name: "Fashion", icon: Shirt, color: "lavender" },
              { name: "Hostel Essentials", icon: Armchair, color: "sand" },
            ].map(({ name, icon: Icon, color }) => (
              <Link
                key={name}
                className={`category-card ${color}`}
                href={`/marketplace?category=${encodeURIComponent(name)}`}
              >
                <Icon size={32} strokeWidth={1.4} />
                <h3>{name}</h3>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </section>
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FRESH ON THE MARKET</span>
              <h2>Your next great find.</h2>
            </div>
            <Link href="/marketplace">
              View all products <ArrowUpRight size={19} />
            </Link>
          </div>
          {error ? (
            <div className="notice">{error}</div>
          ) : products.length ? (
            <div className="product-grid">
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingEmpty />
              <h3>The next chapter starts with you.</h3>
              <p>
                {configured()
                  ? "New listings will appear here when approved vendors publish them."
                  : "The storefront is ready. Connect the marketplace to start publishing real products."}
              </p>
              <Button asChild variant="outline">
                <Link href={configured() ? "/vendor/apply" : "/setup"}>
                  {configured()
                    ? "Become a founding vendor"
                    : "View setup checklist"}{" "}
                  <ArrowRight size={17} />
                </Link>
              </Button>
            </div>
          )}
        </section>
        <section className="container seller-banner">
          <div>
            <span className="eyebrow">HAVE SOMETHING TO OFFER?</span>
            <h2>
              Your hustle deserves
              <br />a storefront.
            </h2>
            <p>Turn your products and skills into your next opportunity.</p>
            <Button asChild>
              <Link href="/vendor/apply">
                Start selling on NSUKart <ArrowUpRight size={18} />
              </Link>
            </Button>
          </div>
          <div className="seller-art">
            <Store size={130} strokeWidth={0.8} />
            <span>
              SMALL BUSINESS.
              <br />
              CAMPUS-SIZED POTENTIAL.
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
function ShoppingEmpty() {
  return <Store size={36} strokeWidth={1.2} />;
}
