import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import BuyingStandardsContent from "@/components/buying-standards/BuyingStandardsContent";

export default async function BuyingStandardsPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const t = await getDictionary(locale, ["home", "buyingStandards"]);

    return <BuyingStandardsContent t={t} locale={locale as Locale} />;
}
