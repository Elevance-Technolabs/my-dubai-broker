import { getDictionary } from "@/i18n/getDictionary";
import ListingManager from "@/components/forms/ListingManager";
import { Locale, LocaleParams } from "@/i18n/config";

export default async function Page({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  // Pre-fetch all needed dictionaries
  const dict = await getDictionary(locale, [
    "home",
    "carListing",
    "yachtListing",
    "realEstateListing",
    "jetListing",
    "helicopterListing",
  ]);

  return (
    <ListingManager
      carDict={dict.carListing}
      homeDict={dict.home}
      yachtDict={dict.yachtListing}
      realEstateDict={dict.realEstateListing}
      jetDict={dict.jetListing}
      helicopterDict={dict.helicopterListing}
      locale={locale as Locale}
    />
  );
}
