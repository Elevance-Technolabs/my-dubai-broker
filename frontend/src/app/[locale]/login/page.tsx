import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import AgentLoginContent from "@/components/auth/AgentLoginContent";

export default async function AgentLoginPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home"]);

  return <AgentLoginContent t={t.home} locale={locale as Locale} />;
}
