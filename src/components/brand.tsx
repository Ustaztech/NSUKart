import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="NSUKart home"
    >
      <svg
        width="35"
        height="40"
        viewBox="0 0 40 44"
        fill="none"
        aria-hidden="true"
      >
        <path d="M11 14V10a9 9 0 0 1 18 0v4" stroke="#D4AF37" strokeWidth="3" />
        <path d="M5 12h30l4 30H1L5 12Z" fill={light ? "#fff" : "#065F46"} />
        <path
          d="M12 34V21l16 13V21"
          stroke={light ? "#065F46" : "white"}
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        NSUK<span className="gold">art</span>
      </span>
    </Link>
  );
}
