import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import TermsContent from "@/components/terms/TermsContent";

export default async function TermsPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "terms"]);

  return <TermsContent t={t} locale={locale as Locale} />;
}
