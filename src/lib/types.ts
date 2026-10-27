export type Product = {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price_kobo: number;
  stock: number;
  condition: string;
  category: string;
  image_url: string | null;
  kind: "product" | "service";
  status: string;
  stores?: { name: string; slug: string; status: string } | null;
};
export type Store = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  pickup: string;
  status: string;
};
