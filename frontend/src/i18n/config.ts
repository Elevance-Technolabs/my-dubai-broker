export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export type LocaleParams = { locale: Locale };

export const defaultLocale: Locale = "en";

export const rtlLocales: Locale[] = ["ar"];
