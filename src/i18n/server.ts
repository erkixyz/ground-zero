import { cookies } from "next/headers";
import { translations, type Locale, type Translations } from "./index";

export async function getServerTranslations(): Promise<{ t: Translations; locale: Locale }> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("gz-locale")?.value;
  const locale: Locale = raw === "en" || raw === "et" ? raw : "et";
  return { t: translations[locale], locale };
}
