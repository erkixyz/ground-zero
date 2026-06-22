"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale, type Translations } from "@/i18n";

type LanguageContextType = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const COOKIE_NAME = "gz-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("et");

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_NAME) as Locale | null;
    if (stored === "en" || stored === "et") setLocaleState(stored);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(COOKIE_NAME, next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
