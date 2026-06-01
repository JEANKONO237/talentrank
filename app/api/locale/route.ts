import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

const COOKIE = "tr_locale";

// Set the visitor's preferred locale. POST { locale: 'fr' | 'en' }
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { locale?: Locale };
  if (!body.locale || !LOCALES.includes(body.locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale: body.locale });
  res.cookies.set(COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
