import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { validSignature, validCron } from "@/lib/security";
import { safeNext, money, csvCell } from "@/lib/utils";
import { signupSchema, productSchema } from "@/lib/schemas";
describe("webhook authentication", () => {
  it("accepts only the signature for the exact raw payload", () => {
    const body = '{"event":"charge.success"}';
    const signature = createHmac("sha512", "test-secret")
      .update(body)
      .digest("hex");
    expect(validSignature(body, signature, "test-secret")).toBe(true);
    expect(validSignature(body + " ", signature, "test-secret")).toBe(false);
    expect(validSignature(body, signature, "wrong")).toBe(false);
  });
  it("rejects missing, malformed and incorrect-length signatures", () => {
    for (const s of [null, "", "xyz", "a".repeat(127), "a".repeat(130)])
      expect(validSignature("{}", s, "key")).toBe(false);
  });
  it("rejects cron requests when the secret is unset", () => {
    expect(validCron("Bearer undefined", undefined)).toBe(false);
    expect(validCron("Bearer key", "key")).toBe(true);
    expect(validCron("Bearer wrong", "key")).toBe(false);
  });
});
describe("input boundaries", () => {
  it("prevents external and protocol-relative auth redirects", () => {
    for (const p of ["https://evil.test", "//evil.test", "/\\evil.test"])
      expect(safeNext(p)).toBe("/dashboard");
    expect(safeNext("/update-password")).toBe("/update-password");
  });
  it("rejects weak passwords and invalid Nigerian phones", () => {
    expect(
      signupSchema.safeParse({
        full_name: "Test User",
        email: "test@example.com",
        phone: "123",
        matric_number: "FT22ACMP0270",
        password: "short",
      }).success,
    ).toBe(false);
  });
  it("rejects negative money, fractional stock and unsafe image schemes", () => {
    expect(
      productSchema.safeParse({
        title: "A book",
        description: "An excellent textbook for campus",
        category: "Textbooks",
        price: -5,
        stock: 1.5,
        condition: "New",
        kind: "product",
        image_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("formats integer kobo as naira", () => {
    expect(money(1850000)).toContain("18,500");
  });
});

describe("export and price precision", () => {
  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe('"\'=HYPERLINK(1)"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it("accepts valid two-decimal prices", () => {
    expect(
      productSchema.safeParse({
        title: "A book",
        description: "An excellent campus textbook",
        category: "Textbooks",
        price: 18.99,
        stock: 2,
        condition: "New",
        kind: "product",
        image_url: "",
      }).success,
    ).toBe(true);
  });
});
