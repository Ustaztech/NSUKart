import Link from "next/link";
export default function Unavailable() {
  return (
    <main id="main" className="container section narrow">
      <h1>Account unavailable</h1>
      <p>
        Your profile could not be loaded or access has been suspended. Contact
        the marketplace operator for support.
      </p>
      <Link href="/">Return home</Link>
    </main>
  );
}
