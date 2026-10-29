import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import FAQContent from "@/components/faq/FAQContent";

export default async function FAQPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "faq"]);

  return <FAQContent t={t} locale={locale as Locale} />;
}
