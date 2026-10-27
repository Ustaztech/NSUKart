import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Header } from "@/components/header";
import { MfaEnrol } from "@/components/mfa-enrol";
export default async function Security() {
  const { profile } = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");
  return (
    <>
      <Header />
      <main id="main" className="container section narrow">
        <h1>One more layer of protection.</h1>
        <MfaEnrol />
      </main>
    </>
  );
}
