import Link from "next/link";
import { Header, Footer } from "@/components/header";
export default function Help() {
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <span className="eyebrow">A LITTLE HELP</span>
        <h1>Shop with confidence.</h1>
        <div className="panel">
          <h2>How buying works</h2>
          <p>
            Create and verify your account, browse approved vendors, add items
            to your cart, then pay through the hosted payment page. Your
            dashboard records the confirmed payment state and each vendor’s
            fulfilment progress.
          </p>
        </div>
        <div className="panel">
          <h2>Pickup and problems</h2>
          <p>
            Agree on the pickup location shown on the order. Confirm receipt
            only after collecting your purchase. Use the order message thread or
            “Report a problem” before completing an order if something is wrong.
          </p>
          <Link href="/dashboard/orders" className="text-link">
            Open your orders →
          </Link>
        </div>
        <div className="panel">
          <h2>Want to sell?</h2>
          <p>
            Apply for a store. Approval is a platform moderation decision, not
            proof of university endorsement. Do not list prohibited goods or
            products you cannot fulfil.
          </p>
          <Link href="/vendor/apply" className="text-link">
            Apply for a store →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
