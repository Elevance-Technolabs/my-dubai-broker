import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import StoriesContent from "@/components/stories/StoriesContent";

export default async function StoriesPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "stories"]);

  return <StoriesContent t={t} locale={locale as Locale} />;
}
