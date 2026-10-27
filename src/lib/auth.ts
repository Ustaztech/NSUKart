import "server-only";
import { redirect } from "next/navigation";
import { configured } from "./config";
import { db } from "./supabase/server";
export async function requireUser(role?: "vendor" | "admin") {
  if (!configured()) redirect("/setup");
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile) redirect("/account/unavailable?reason=profile");
  if (profile.suspended) redirect("/account/unavailable?reason=suspended");
  if (role && profile.role !== role && profile.role !== "admin")
    redirect("/dashboard");
  if (role === "admin") {
    const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2") redirect("/account/security");
  }
  return { client, user, profile };
}
