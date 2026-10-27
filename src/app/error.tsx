"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Something needs another try.</h1>
      <p>
        We couldn’t load this page. Your payment status is always checked on the
        server.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
