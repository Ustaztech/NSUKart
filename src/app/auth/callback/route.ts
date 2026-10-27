import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";
import { appUrl, configured } from "@/lib/config";
export async function GET(request: NextRequest) {
  if (!configured()) return NextResponse.redirect(new URL("/setup", appUrl()));
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const client = await db();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeNext(request.nextUrl.searchParams.get("next")), appUrl()),
      );
  }
  return NextResponse.redirect(
    new URL("/login?error=This+link+has+expired.+Please+try+again.", appUrl()),
  );
}
