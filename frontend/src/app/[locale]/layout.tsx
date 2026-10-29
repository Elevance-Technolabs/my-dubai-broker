import { locales, rtlLocales, Locale, LocaleParams } from "@/i18n/config";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={dir}>
      <>{children}</>
    </div>
  );
}
