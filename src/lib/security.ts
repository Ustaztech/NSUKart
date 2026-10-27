import { createHmac, timingSafeEqual } from "node:crypto";
export function validSignature(
  body: string,
  signature: string | null,
  secret: string,
) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const actual = Buffer.from(signature, "hex");
  const expected = Buffer.from(
    createHmac("sha512", secret).update(body).digest("hex"),
    "hex",
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function validCron(value: string | null, secret: string | undefined) {
  if (!secret || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
