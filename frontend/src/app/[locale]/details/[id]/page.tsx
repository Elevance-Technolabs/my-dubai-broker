import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/getDictionary";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Breadcrumb from "@/components/ui/Breadcrumb";
import BackButton from "@/components/ui/BackButton";
import PropertyGallery from "@/components/property/PropertyGallery";
import PropertyInfo from "@/components/property/PropertyInfo";
import AgentSidebar from "@/components/property/AgentSidebar";
import { Locale, LocaleParams } from "@/i18n/config";
import SeeMoreProperties from "@/components/property/SeeMoreProperties";
import Newsletter from "@/components/newsletter/Newsletter";
import { listingService } from "@/services/listing.service";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<LocaleParams & { id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getDictionary(locale, ["home"]);

  // SSR: the approved listing is fetched server-side for SEO and fast first paint.
  const response = await listingService.getPublicListingById(id);
  if (!response.success || !response.data) {
    notFound();
  }
  const listing = response.data;

  const relatedResponse = await listingService.getPublicListings({
    categoryType: listing.categoryType,
    excludeId: listing.id,
    limit: 4,
  });
  const relatedListings = relatedResponse.success && relatedResponse.data ? relatedResponse.data.listings : [];

  const galleryImages = listing.media.photos.length
    ? listing.media.photos
    : ["/images/placeholder.jpg"];

  return (
    <>
      <Navbar
        t={t.home}
        wrapperClassName="bg-[#FFFFFF] shadow-sm"
        textClassName="text-black"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-slate-200"
        locale={locale as Locale}
      />
      <div className="bg-[#FFFFFF] pt-24">
        <SectionWrapper>
          {/* <Breadcrumb className="my-6" /> */}
          <BackButton label="Back to Collection" className="my-6" />
        </SectionWrapper>
      </div>
      <main className="bg-[#FFFFFF] min-h-screen pb-20">
        <SectionWrapper>
          <div className="mb-12">
            <PropertyGallery images={galleryImages} />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 relative">
            {/* Main Content */}
            <div className="w-full lg:w-2/3">
              <PropertyInfo listing={listing} />
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-1/3 relative">
              <AgentSidebar listing={listing} />
            </div>
          </div>
        </SectionWrapper>

        {/* See More Properties */}
        <SectionWrapper>
          <SeeMoreProperties listings={relatedListings} />
        </SectionWrapper>
      </main>
      <SectionWrapper bg="bg-bg-light">
        <Newsletter t={t.home} />
      </SectionWrapper>
      <Footer t={t.home} />
    </>
  );
}
