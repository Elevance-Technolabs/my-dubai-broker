import { getDictionary } from "@/i18n/getDictionary";
import Collections from "@/components/collections/Collections";
import ExclusiveCarousel from "@/components/exclusiveCarousel/ExclusiveCarousel";
import Hero from "@/components/layout/Hero";
import Navbar from "@/components/layout/Navbar";
import LuxuryInsights from "@/components/luxuryInsights/LuxuryInsights";
import TrustedBrands from "@/components/trustedBrands/TrustedBrands";
import Newsletter from "@/components/newsletter/Newsletter";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { LocaleParams } from "@/i18n/config";
import Essentials from "@/components/collections/Essentials";
import { listingService } from "@/services/listing.service";

// The page is prerendered (SSG via the locale layout's generateStaticParams),
// so without this the listings carousel would be frozen at deploy time.
export const revalidate = 60;

export default async function Page({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home"]);
  const listingsResponse = await listingService.getPublicListings({ limit: 8 });
  const listings =
    listingsResponse.success && listingsResponse.data
      ? listingsResponse.data.listings
      : [];

  return (
    <>
      <Navbar t={t.home} locale={locale} />
      <Hero t={t.home} />

      <main>
        <SectionWrapper bg="bg-bg-light">
          <Collections t={t.home} />
        </SectionWrapper>

        <ExclusiveCarousel t={t.home} listings={listings} />

        <SectionWrapper bg="bg-bg-light">
          <LuxuryInsights t={t.home} />
        </SectionWrapper>

        <SectionWrapper>
          <Essentials type="realEstate" t={t.home} locale={locale} />
        </SectionWrapper>

        <SectionWrapper>
          <TrustedBrands t={t.home} />
        </SectionWrapper>

        <SectionWrapper bg="bg-bg-light">
          <Newsletter t={t.home} />
        </SectionWrapper>
      </main>

      <Footer t={t.home} />
    </>
  );
}
