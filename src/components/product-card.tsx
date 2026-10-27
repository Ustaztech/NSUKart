import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { money } from "@/lib/utils";
import type { Product } from "@/lib/types";
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/products/${p.id}`} className="product-image">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <ShoppingBag size={46} />
        )}
        <span className="condition">{p.condition}</span>
      </Link>
      <div className="product-copy">
        <small>{p.category}</small>
        <Link href={`/products/${p.id}`}>
          <h3>{p.title}</h3>
        </Link>
        <p>{p.stores?.name ?? "Campus store"}</p>
        <div className="price-row">
          <strong>{money(p.price_kobo)}</strong>
          <Link href={`/products/${p.id}`} aria-label={`View ${p.title}`}>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
