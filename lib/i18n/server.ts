import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale, t as translateFor } from "./dictionaries";

const COOKIE = "tr_locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COOKIE)?.value as Locale | undefined;
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;

  // Negotiate from Accept-Language: first matching locale wins.
  const headerStore = await headers();
  const accept = (headerStore.get("accept-language") ?? "").toLowerCase();
  for (const l of LOCALES) {
    if (accept.includes(l)) return l;
  }
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string) => translateFor(locale, key),
  };
}
