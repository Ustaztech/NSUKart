import { z } from "zod";
export const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: z
    .string()
    .regex(/^(?:\+234|0)[789]\d{9}$/, "Use a valid Nigerian phone number"),
  matric_number: z.string().trim().min(5).max(40),
  password: z.string().min(12).max(128),
});
export const productSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(15).max(5000),
  category: z.enum([
    "Textbooks",
    "Electronics",
    "Fashion",
    "Hostel Essentials",
    "Food & Groceries",
    "Digital Services",
  ]),
  price: z.coerce
    .number()
    .positive()
    .max(10000000)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001,
      "Use at most two decimal places",
    ),
  stock: z.coerce.number().int().min(0).max(100000),
  condition: z.enum(["New", "Used"]),
  kind: z.enum(["product", "service"]),
  image_url: z.union([z.url().startsWith("https://"), z.literal("")]),
});
export const storeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]{3,100}$/),
  description: z.string().trim().min(20).max(2000),
  pickup: z.string().trim().min(5).max(500),
});
export function fieldData(form: FormData) {
  return Object.fromEntries(form.entries());
}
