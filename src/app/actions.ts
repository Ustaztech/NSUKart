"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { configured, appUrl } from "@/lib/config";
import { allowRequest } from "@/lib/rate-limit";
import {
  signupSchema,
  productSchema,
  storeSchema,
  fieldData,
} from "@/lib/schemas";
function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
export async function login(form: FormData) {
  if (!configured()) redirect("/setup");
  const input = z
    .object({ email: z.email(), password: z.string().min(1).max(128) })
    .safeParse(fieldData(form));
  if (!input.success) fail("/login", "Enter a valid email and password.");
  const client = await db();
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error)
    fail("/login", "Sign-in failed. Check your email and password.");
  redirect("/dashboard");
}
export async function signup(form: FormData) {
  if (!configured()) redirect("/setup");
  const input = signupSchema.safeParse(fieldData(form));
  if (!input.success || form.get("terms") !== "on")
    fail(
      "/signup",
      "Complete all fields, use a 12-character password, and accept the terms.",
    );
  const { email, password, ...data } = input.data;
  const client = await db();
  const { data: registration, error } = await client.auth.signUp({
    email,
    password,
    options: { data, emailRedirectTo: `${appUrl()}/auth/callback` },
  });
  if (error)
    fail(
      "/signup",
      "Unable to create your account. Check your details or try signing in.",
    );
  // With Supabase email confirmation disabled, signup creates a session immediately.
  // Keep password reset and recovery emails enabled in Supabase Auth.
  if (registration.session) redirect("/dashboard");
  redirect("/login?message=Account+created.+Sign+in+to+continue.");
}
export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect("/login");
}
export async function resetPassword(form: FormData) {
  if (!configured()) redirect("/setup");
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) fail("/reset-password", "Enter a valid email.");
  const client = await db();
  await client.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl()}/auth/callback?next=/update-password`,
  });
  redirect(
    "/reset-password?message=If+the+account+exists,+a+reset+link+will+be+sent.",
  );
}
export async function updatePassword(form: FormData) {
  await requireUser();
  const password = z.string().min(12).max(128).safeParse(form.get("password"));
  if (!password.success)
    fail("/update-password", "Use at least 12 characters.");
  const client = await db();
  const { error } = await client.auth.updateUser({ password: password.data });
  if (error)
    fail(
      "/update-password",
      "Password could not be updated. Request a fresh reset link.",
    );
  await client.auth.signOut();
  redirect("/login?message=Password+updated.+Sign+in+again.");
}
export async function addToCart(form: FormData) {
  const { client, user } = await requireUser();
  const id = z.uuid().parse(form.get("product_id"));
  const quantity = z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .parse(form.get("quantity") ?? 1);
  const { data: old } = await client
    .from("cart_items")
    .select("id,quantity")
    .eq("buyer_id", user.id)
    .eq("product_id", id)
    .maybeSingle();
  const { error } = old
    ? await client
        .from("cart_items")
        .update({ quantity: Math.min(20, old.quantity + quantity) })
        .eq("id", old.id)
    : await client
        .from("cart_items")
        .insert({ buyer_id: user.id, product_id: id, quantity });
  if (error) fail("/cart", "Could not add this item.");
  revalidatePath("/cart");
  redirect("/cart");
}
export async function removeCartItem(form: FormData) {
  const { client, user } = await requireUser();
  await client
    .from("cart_items")
    .delete()
    .eq("id", z.uuid().parse(form.get("id")))
    .eq("buyer_id", user.id);
  revalidatePath("/cart");
}
export async function checkout() {
  const { client } = await requireUser();
  if (!(await allowRequest("checkout", 5)))
    fail("/cart", "Too many checkout attempts. Please wait a minute.");
  const { data, error } = await client.rpc("checkout_cart");
  if (error) fail("/cart", error.message);
  redirect(`/checkout?order=${data}`);
}
export async function applyVendor(form: FormData) {
  const { client, user } = await requireUser();
  const input = storeSchema.safeParse(fieldData(form));
  if (!input.success)
    fail(
      "/vendor/apply",
      "Please complete the store details. Use a lowercase URL slug with hyphens.",
    );
  const { error } = await client
    .from("stores")
    .insert({ ...input.data, owner_id: user.id });
  if (error)
    fail(
      "/vendor/apply",
      "Could not submit. Your account may already have a store, or that URL may be taken.",
    );
  redirect(
    "/vendor/apply?message=Application+submitted.+An+administrator+will+review+your+store.",
  );
}
export async function saveProduct(form: FormData) {
  const { client, user } = await requireUser("vendor");
  const input = productSchema.safeParse(fieldData(form));
  if (!input.success)
    fail(
      "/vendor/products",
      "Please check the product fields, price, and image URL.",
    );
  const { data: store } = await client
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!store) fail("/vendor/products", "Store not found.");
  const d = input.data;
  const id = form.get("id") ? z.uuid().parse(form.get("id")) : null;
  const { error } = await client.rpc("save_product", {
    p_id: id,
    p_store: store.id,
    p_title: d.title,
    p_description: d.description,
    p_category: d.category,
    p_price: Math.round(d.price * 100),
    p_stock: d.stock,
    p_condition: d.condition,
    p_kind: d.kind,
    p_image: d.image_url || null,
  });
  if (error) fail("/vendor/products", error.message);
  revalidatePath("/marketplace");
  redirect("/vendor/products?message=Product+saved.");
}
export async function reviewVendor(form: FormData) {
  const { client } = await requireUser("admin");
  const status = z
    .enum(["approved", "rejected", "suspended"])
    .parse(form.get("status"));
  const { error } = await client.rpc("review_vendor", {
    p_id: z.uuid().parse(form.get("id")),
    p_status: status,
    p_note: String(form.get("note") ?? "").slice(0, 1000),
  });
  if (error) fail("/admin/vendors", error.message);
  revalidatePath("/admin/vendors");
}
export async function fulfilOrder(form: FormData) {
  const { client } = await requireUser();
  const status = z
    .enum(["accepted", "ready", "completed"])
    .parse(form.get("status"));
  const { error } = await client.rpc("update_fulfilment", {
    p_id: z.uuid().parse(form.get("id")),
    p_status: status,
    p_code: String(form.get("code") ?? ""),
  });
  if (error) fail("/dashboard/orders", error.message);
  revalidatePath("/dashboard/orders");
  revalidatePath("/vendor/orders");
}
export async function createReview(form: FormData) {
  const { client, user } = await requireUser();
  const input = z
    .object({
      order_item_id: z.uuid(),
      product_id: z.uuid(),
      rating: z.coerce.number().int().min(1).max(5),
      body: z.string().min(3).max(2000),
    })
    .safeParse(fieldData(form));
  if (!input.success)
    fail("/dashboard/orders", "Check your rating and review.");
  const { error } = await client
    .from("reviews")
    .insert({ ...input.data, buyer_id: user.id });
  if (error)
    fail("/dashboard/orders", "Only completed purchases can be reviewed once.");
  revalidatePath("/dashboard/orders");
}
export async function openDispute(form: FormData) {
  const { client, user } = await requireUser();
  const reason = z.string().min(10).max(4000).parse(form.get("reason"));
  const { error } = await client
    .from("disputes")
    .insert({
      buyer_id: user.id,
      vendor_order_id: z.uuid().parse(form.get("id")),
      reason,
    });
  if (error)
    fail("/dashboard/orders", "A dispute cannot be opened for this order.");
  revalidatePath("/dashboard/orders");
}
export async function sendMessage(form: FormData) {
  const { client, user } = await requireUser();
  if (!(await allowRequest("message", 20)))
    fail(
      "/dashboard/orders",
      "Please wait a minute before sending another message.",
    );
  const { error } = await client
    .from("messages")
    .insert({
      vendor_order_id: z.uuid().parse(form.get("id")),
      sender_id: user.id,
      body: z.string().trim().min(1).max(2000).parse(form.get("body")),
    });
  if (error) fail("/dashboard/orders", "Message could not be sent.");
  revalidatePath("/dashboard/orders");
  revalidatePath("/vendor/orders");
}
export async function requestWithdrawal(form: FormData) {
  const { client } = await requireUser("vendor");
  const amount = z.coerce
    .number()
    .min(100)
    .max(10000000)
    .parse(form.get("amount"));
  const { error } = await client.rpc("request_withdrawal", {
    p_amount: Math.round(amount * 100),
    p_bank: z.string().min(10).max(1000).parse(form.get("bank")),
  });
  if (error) fail("/vendor/earnings", error.message);
  revalidatePath("/vendor/earnings");
}
export async function toggleWishlist(form: FormData) {
  const { client, user } = await requireUser();
  const product_id = z.uuid().parse(form.get("product_id"));
  const { data } = await client
    .from("wishlist")
    .select("product_id")
    .eq("buyer_id", user.id)
    .eq("product_id", product_id)
    .maybeSingle();
  if (data)
    await client
      .from("wishlist")
      .delete()
      .eq("buyer_id", user.id)
      .eq("product_id", product_id);
  else await client.from("wishlist").insert({ buyer_id: user.id, product_id });
  revalidatePath("/dashboard/wishlist");
}
export async function resolveDispute(form: FormData) {
  const { client } = await requireUser("admin");
  const { error } = await client
    .from("disputes")
    .update({
      status: z
        .enum(["review", "resolved", "closed"])
        .parse(form.get("status")),
      resolution: z.string().min(5).max(4000).parse(form.get("resolution")),
    })
    .eq("id", z.uuid().parse(form.get("id")));
  if (error) fail("/admin/disputes", "Could not update dispute.");
  revalidatePath("/admin/disputes");
}
export async function moderateProduct(form: FormData) {
  const { client } = await requireUser("admin");
  const { error } = await client
    .from("products")
    .update({
      status: z.enum(["published", "archived"]).parse(form.get("status")),
    })
    .eq("id", z.uuid().parse(form.get("id")));
  if (error) fail("/admin/products", "Could not moderate listing.");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
}
export async function reviewWithdrawal(form: FormData) {
  const { client } = await requireUser("admin");
  const { error } = await client.rpc("review_withdrawal", {
    p_id: z.uuid().parse(form.get("id")),
    p_status: z
      .enum(["processing", "paid", "rejected"])
      .parse(form.get("status")),
    p_reference: String(form.get("reference") ?? ""),
  });
  if (error) fail("/admin/withdrawals", error.message);
  revalidatePath("/admin/withdrawals");
}
export async function manageAccount(form: FormData) {
  const { client } = await requireUser("admin");
  const { error } = await client.rpc("manage_account", {
    p_id: z.uuid().parse(form.get("id")),
    p_suspended: form.get("suspended") === "true",
  });
  if (error) fail("/admin/users", error.message);
  revalidatePath("/admin/users");
}
export async function updateProfile(form: FormData) {
  const { client } = await requireUser();
  const input = z
    .object({
      full_name: z.string().trim().min(2).max(120),
      phone: z.string().regex(/^(?:\+234|0)[789]\d{9}$/),
    })
    .safeParse(fieldData(form));
  if (!input.success)
    fail("/dashboard/account", "Check your name and Nigerian phone number.");
  const { error } = await client.rpc("update_profile", {
    p_name: input.data.full_name,
    p_phone: input.data.phone,
  });
  if (error) fail("/dashboard/account", error.message);
  revalidatePath("/dashboard/account");
}
export async function readNotifications() {
  const { client } = await requireUser();
  await client.rpc("mark_notifications_read");
  revalidatePath("/dashboard/notifications");
}

export async function createDemoCatalogue() {
  const { client } = await requireUser("admin");
  const { error } = await client.rpc("seed_demo_catalogue");
  if (error) fail("/admin/demo", "Could not create demo listings: " + error.message);
  revalidatePath("/");
  revalidatePath("/marketplace");
  redirect("/admin/demo");
}
export async function deleteDemoCatalogue() {
  const { client } = await requireUser("admin");
  const { error } = await client.rpc("clear_demo_catalogue");
  if (error) fail("/admin/demo", "Could not remove demo listings: " + error.message);
  revalidatePath("/");
  revalidatePath("/marketplace");
  redirect("/admin/demo");
}
