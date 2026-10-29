import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import SupportContent from "@/components/support/SupportContent";

export default async function SupportPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "support"]);

  return <SupportContent t={t} locale={locale as Locale} />;
}
