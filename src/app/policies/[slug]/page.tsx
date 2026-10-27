import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/header";
export default async function Policy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!["terms", "privacy"].includes(slug)) notFound();
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <span className="eyebrow">MARKETPLACE POLICIES</span>
        <h1>
          {slug === "privacy"
            ? "Your information matters."
            : "Clear expectations. Better trade."}
        </h1>
        <p className="notice">
          Operator review required before public launch. The operator must add
          its legal identity, contact details, retention schedule, and final
          refund terms.
        </p>
        {slug === "privacy" ? (
          <>
            <h2>Information collected</h2>
            <p>
              Account details, private institutional identifiers, store
              information, orders, messages, payment references, and support
              records support marketplace operation. Card details are handled by
              the payment provider and are not stored by NSUKart.
            </p>
            <h2>Access and retention</h2>
            <p>
              Buyers and vendors access only the records needed for their
              transactions. Authorized administrators handle moderation and
              support. Account deletion and data-access requests must be handled
              by the operator, with necessary financial records retained under
              the applicable policy.
            </p>
            <h2>Service providers</h2>
            <p>
              Supabase stores application data and authenticates users. Paystack
              processes payments. Resend delivers transactional email.
              Deployment infrastructure serves the application. Marketing opt-in
              is not collected or enabled in this release.
            </p>
          </>
        ) : (
          <>
            <h2>Buying and selling</h2>
            <p>
              Give accurate descriptions, honour listed prices, and use agreed
              campus pickup arrangements. Platform approval is not official
              university verification. Prohibited items include illegal goods,
              stolen goods, weapons, and fraudulent academic services.
            </p>
            <h2>Completion and disputes</h2>
            <p>
              Confirm receipt only after receiving your order. Report problems
              through the order before completion. Administrators review
              evidence and communicate decisions. A dispute resolution entry
              does not itself mean a refund has been executed.
            </p>
            <h2>Payments and vendor earnings</h2>
            <p>
              Prices are in naira. Payment is confirmed only after server
              verification. The initial commission is 5% of completed vendor
              suborders. Vendor earnings are accounting entries and are not a
              regulated wallet or escrow service. Payouts and refunds require
              the operator’s approved provider arrangements.
            </p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
