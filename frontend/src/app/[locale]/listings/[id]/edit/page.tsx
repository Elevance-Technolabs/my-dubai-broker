import { getDictionary } from "@/i18n/getDictionary";
import EditListingManager from "@/components/forms/EditListingManager";
import { Locale, LocaleParams } from "@/i18n/config";

export default async function EditListingPage({
  params,
}: {
  params: Promise<LocaleParams & { id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale, [
    "home",
    "carListing",
    "yachtListing",
    "realEstateListing",
    "jetListing",
    "helicopterListing",
  ]);

  return (
    <EditListingManager
      carDict={dict.carListing}
      homeDict={dict.home}
      yachtDict={dict.yachtListing}
      realEstateDict={dict.realEstateListing}
      jetDict={dict.jetListing}
      helicopterDict={dict.helicopterListing}
      locale={locale as Locale}
      listingId={id}
    />
  );
}
