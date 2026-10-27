import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <h1>This find got away.</h1>
      <p>The page or listing isn’t available.</p>
      <Link className="btn btn-primary" href="/marketplace">
        Back to marketplace
      </Link>
    </main>
  );
}
