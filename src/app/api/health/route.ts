import { NextResponse } from "next/server";
import { configured } from "@/lib/config";
export async function GET() {
  return NextResponse.json(
    { application: "NSUKart", status: "ok", databaseConfigured: configured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
