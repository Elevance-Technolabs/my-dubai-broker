import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import BusinessTermsContent from "@/components/business-terms/BusinessTermsContent";

export default async function BusinessTermsPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const t = await getDictionary(locale, ["home", "businessTerms"]);

    return <BusinessTermsContent t={t} locale={locale as Locale} />;
}
