import { createClient } from "@supabase/supabase-js";
const email = process.argv[2];
if (
  !email ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw new Error(
    "Provide an existing account email and server environment variables.",
  );
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
let found = null;
for (let page = 1; page <= 100; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  found = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (found || data.users.length < 100) break;
}
if (!found)
  throw new Error(
    "Create and verify the account through normal sign-up first.",
  );
if (!found.email_confirmed_at)
  throw new Error("Verify the account email first.");
const { error } = await db
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", found.id);
if (error) throw error;
console.log(
  "Administrator role provisioned. Enrol MFA before accessing administrator functions.",
);
