import Link from "next/link";
import { db } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
async function recoverProfile() {
  "use server";
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await client.rpc("repair_own_profile");
  if (error) redirect("/account/unavailable?reason=repair-failed");
  redirect("/dashboard");
}
export default async function Unavailable({searchParams}:{searchParams:Promise<{reason?:string}>}) {
  const {reason} = await searchParams;
  const suspended = reason === "suspended";
  return <main id="main" className="container section narrow">
    <h1>{suspended ? "Account access suspended" : "We could not load your profile"}</h1>
    <p>{suspended ? "Your account is suspended. Contact the marketplace operator for assistance." : "Your login succeeded, but the account profile is missing or currently unavailable. You can retry safely without creating another account."}</p>
    {!suspended && <form action={recoverProfile}><button className="btn btn-primary">Repair my profile</button></form>}
    {reason==="repair-failed" && <p className="notice error">Automatic recovery is not yet available. The marketplace administrator must apply the profile recovery database migration.</p>}
    <p><Link href="/login">Back to sign in</Link> · <Link href="/">Return home</Link></p>
  </main>;
}
