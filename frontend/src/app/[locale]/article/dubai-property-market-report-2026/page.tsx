import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import FullArticleContent from "@/components/views/FullArticleContent";

export default async function ArticleReportPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "blog", "blogArticle"]);

  return <FullArticleContent t={t} locale={locale as Locale} />;
}
