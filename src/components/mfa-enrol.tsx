"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "./ui/button";
export function MfaEnrol() {
  const router = useRouter();
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function client() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return (
    <div className="panel">
      <h2>Protect administrator access</h2>
      <p>
        Use an authenticator app. An AAL2 session is required for administrator
        actions in both the app and database.
      </p>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const c = client();
            const { data, error } = await c.auth.mfa.listFactors();
            if (error) throw error;
            const existing = data.totp.find((f) => f.status === "verified");
            if (existing) {
              setFactor(existing.id);
              setMessage("Enter the current code from your authenticator.");
            } else {
              for (const f of data.totp.filter((f) => f.status !== "verified"))
                await c.auth.mfa.unenroll({ factorId: f.id });
              const { data: enrol, error: enrolError } =
                await c.auth.mfa.enroll({
                  factorType: "totp",
                  friendlyName: "NSUKart administrator",
                });
              if (enrolError) throw enrolError;
              setFactor(enrol.id);
              setQr(enrol.totp.qr_code);
              setMessage(
                "Scan this QR code with your authenticator, then enter its code.",
              );
            }
          } catch {
            setMessage("MFA setup failed. Please sign in again and retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Set up / verify authenticator
      </Button>
      {message && <p role="status">{message}</p>}
      {qr && (
        /* QR is a trusted Supabase data URI, not arbitrary HTML. */ <div
          style={{ maxWidth: 220 }}
        >
          <Image
            unoptimized
            src={qr}
            alt="Authenticator enrolment QR code"
            width="220"
            height="220"
          />
        </div>
      )}
      {factor && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const code = String(new FormData(e.currentTarget).get("code"));
              const { error } = await client().auth.mfa.challengeAndVerify({
                factorId: factor,
                code,
              });
              if (error) throw error;
              router.push("/admin");
              router.refresh();
            } catch {
              setMessage(
                "That code could not be verified. Try the latest code.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Six-digit authenticator code
            <input
              name="code"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
            />
          </label>
          <Button disabled={busy}>Verify and continue</Button>
        </form>
      )}
    </div>
  );
}
