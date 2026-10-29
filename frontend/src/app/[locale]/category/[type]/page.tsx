import Navbar from "@/components/layout/Navbar";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import Newsletter from "@/components/newsletter/Newsletter";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import {
  CAR_HERO,
  COLLECTIBLES_HERO,
  JETS_HERO,
  REAL_ESTATE_HERO,
  RENTALS_HERO,
  YACHTS_HERO,
} from "@/data/category-data";
import CarCategoryView from "@/components/views/CarCategoryView";
import YachtCategoryView from "@/components/views/YachtCategoryView";
import JetCategoryView from "@/components/views/JetCategoryView";
import RealEstateCategoryView from "@/components/views/RealEstateCategoryView";
import { listingService } from "@/services/listing.service";
import { Listing } from "@/types/listing";

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

type Props = {
  params: Promise<{
    locale: string;
    type: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { locale, type } = await params;
  const t = await getDictionary(locale, ["home", "category"]);

  const response = await listingService.getPublicListings({
    categoryType: getCategoryType(type),
    limit: 8,
  });
  const listings: Listing[] =
    response.success && response.data ? response.data.listings : [];

  const heroData =
    type === "cars" || type === "automotive"
      ? CAR_HERO
      : type === "yachts"
        ? YACHTS_HERO
        : type === "jets"
          ? JETS_HERO
          : type === "rentals"
            ? RENTALS_HERO
            : type === "collectibles"
              ? COLLECTIBLES_HERO
              : REAL_ESTATE_HERO;

  // @ts-ignore
  const heroContent = t.category.hero[type] || t.category.hero.realEstate;

  const isCarListing = type === "cars";
  const isYachtListing = type === "yachts";
  const isJetListing = type === "jets";

  const getSearchPlaceholder = (type: string) => {
    switch (type) {
      case "cars":
      case "automotive":
        return "Search by make, model (e.g. Ferrari, Porsche)";
      case "yachts":
        return "Search by builder, length, or year";
      case "jets":
        return "Search by manufacturer, range, or speed";
      case "rentals":
        return "Search by location, duration, or property type";
      case "collectibles":
        return "Search by artist, brand, or era";
      default:
        return "Search by location, community, or lifestyle";
    }
  };

  return (
    <main>
      <Navbar t={t.home} locale={locale as Locale} />

      <PageHero
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        backgroundImage={heroData.backgroundImage}
        className="h-[80vh] min-h-[500px]"
        searchPlaceholder={getSearchPlaceholder(type)}
      />

      {isCarListing ? (
        <CarCategoryView type={type} dict={t} listings={listings} />
      ) : isYachtListing ? (
        <YachtCategoryView type={type} dict={t} listings={listings} />
      ) : isJetListing ? (
        <JetCategoryView type={type} dict={t} listings={listings} />
      ) : (
        <RealEstateCategoryView type={type} dict={t} listings={listings} />
      )}

      {!isYachtListing && !isJetListing && (
        <SectionWrapper bg="bg-bg-light">
          <Newsletter t={t.home} />
        </SectionWrapper>
      )}

      <Footer t={t.home} />
    </main>
  );
}
