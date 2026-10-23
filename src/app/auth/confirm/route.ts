import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Az e-mailekben lévő linkek (regisztráció megerősítése, jelszó-visszaállítás) ide mutatnak.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = type === "recovery" ? "/uj-jelszo" : "/";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }
  return NextResponse.redirect(new URL("/belepes?hiba=link", request.url));
}
