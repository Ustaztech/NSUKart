import { Header, Footer } from "@/components/header";
export default function Setup() {
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <span className="eyebrow">GETTING READY</span>
        <h1>Connect your marketplace.</h1>
        <p>
          NSUKart is installed. An administrator needs to complete the secure
          service configuration before accounts, listings, and payments become
          available.
        </p>
        <ol className="setup-list">
          <li>Connect a Supabase project and apply the SQL migrations.</li>
          <li>Configure authentication redirect URLs and email delivery.</li>
          <li>Add Paystack server credentials and the verified webhook URL.</li>
          <li>Configure Resend and a verified sending domain.</li>
          <li>
            Schedule the protected jobs endpoint for email delivery and payment
            reconciliation.
          </li>
          <li>Provision the administrator and run the acceptance tests.</li>
        </ol>
        <p className="notice">
          No sample purchases, accounts, or payment confirmations are created by
          this setup screen. See the repository README for the exact steps.
        </p>
      </main>
      <Footer />
    </>
  );
}
