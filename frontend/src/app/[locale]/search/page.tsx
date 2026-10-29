import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import SearchContent from "@/components/search/SearchContent";

export default async function SearchPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "search"]);

  return <SearchContent t={t} locale={locale as Locale} />;
}
