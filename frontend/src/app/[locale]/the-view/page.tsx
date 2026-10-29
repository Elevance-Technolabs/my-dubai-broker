import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import ViewContent from "@/components/views/ViewContent";

export default async function ViewPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "blog"]);

  return <ViewContent t={t} locale={locale as Locale} />;
}
