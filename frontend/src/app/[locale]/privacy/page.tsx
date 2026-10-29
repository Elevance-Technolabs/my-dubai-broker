import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import PrivacyContent from "@/components/privacy/PrivacyContent";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "privacy"]);

  return <PrivacyContent t={t} locale={locale as Locale} />;
}
