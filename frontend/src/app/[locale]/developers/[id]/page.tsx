import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale } from "@/i18n/config";
import DeveloperContent from "@/components/developer/DeveloperContent";

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getDictionary(locale, ["home", "developer", "search"]);

  return <DeveloperContent t={t} locale={locale as Locale} developerId={id} />;
}
