import "server-only";
import { cookies } from "next/headers";
import { type Dictionary, LOCALE_COOKIE, type Locale, dictionaries, toLocale } from ".";

/** The language chosen in this browser, for Server Components. */
export async function getLocale(): Promise<Locale> {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
