import React from "react";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import BrandVisibilityView from "@/components/views/BrandVisibilityView";

export default async function BrandVisibilityPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const t = await getDictionary(locale, ["home", "brandVisibility"]);

    return <BrandVisibilityView t={t} locale={locale as Locale} />;
}
