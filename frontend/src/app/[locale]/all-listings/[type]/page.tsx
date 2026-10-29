import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import ListingView from "@/components/listing-view/ListingView";
import Newsletter from "@/components/newsletter/Newsletter";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { listingService } from "@/services/listing.service";
import { Listing } from "@/types/listing";

type Props = {
  params: Promise<{
    locale: string;
    type: string;
  }>;
};

const getCategoryType = (type: string) => {
  switch (type) {
    case "cars":
    case "automotive":
      return "CARS";
    case "yachts":
      return "YACHTS";
    case "jets":
    case "helicopters":
      return "PRIVATE_AVIATION";
    case "real-estate":
    default:
      return "REAL_ESTATE";
  }
};

export default async function ListingDetailsPage({ params }: Props) {
  const { locale, type } = await params;
  const t = await getDictionary(locale, ["home"]);

  const getTitle = (type: string) => {
    switch (type) {
      case "real-estate":
        return "Luxury Real Estate in Dubai";
      case "cars":
      case "automotive":
        return "Automotive Collection";
      case "yachts":
        return "Yacht Collection";
      case "jets":
        return "Jet Collection";
      default:
        return "Luxury Collections";
    }
  };

  // SSR: approved listings are fetched server-side for SEO and fast first paint.
  const response = await listingService.getPublicListings({
    categoryType: getCategoryType(type),
    limit: 13,
  });
  const listings: Listing[] =
    response.success && response.data ? response.data.listings : [];
  const loadError = !response.success ? response.error : null;

  return (
    <main>
      <Navbar
        t={t.home}
        locale={locale as Locale}
        textClassName="text-black"
        wrapperClassName="shadow-md"
        loginBtnClasses="text-black border-slate-200"
        sellWithUsClassName="text-black"
      />

      {loadError && (
        <div className="max-w-7xl mx-auto px-6 pt-32">
          <p className="text-sm text-red-500 font-light bg-red-50 border border-red-100 px-4 py-3">
            We couldn&apos;t load these listings right now. Please refresh the
            page.
          </p>
        </div>
      )}

      <ListingView category={type} title={getTitle(type)} listings={listings} />

      <Footer t={t.home} />
    </main>
  );
}
