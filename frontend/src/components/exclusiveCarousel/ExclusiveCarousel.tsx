import SectionHeading from "../ui/SectionHeading";
import SectionWrapper from "../layout/SectionWrapper";
import { HomeDict } from "@/types/dictionary";
import { Listing } from "@/types/listing";
import AssetCard from "../ui/CategoryCard";

type ExclusiveCarouselProps = {
  t: HomeDict;
  listings: Listing[];
};

const ExclusiveCarousel = ({ t, listings }: ExclusiveCarouselProps) => {
  if (listings.length === 0) return null;

  return (
    <SectionWrapper>
      <section className="py-15 bg-white overflow-hidden">
        <div className="container mx-auto px-6 lg:px-10">
          <SectionHeading
            title={
              <>
                <span className="font-bold">{t.exclusives.heading.bold}</span>{" "}
                <span className="font-light">{t.exclusives.heading.light}</span>
              </>
            }
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {listings.map((listing) => (
              <AssetCard
                key={listing.id}
                logo="/icons/category/box-axis.svg"
                images={
                  listing.media.photos.length
                    ? listing.media.photos
                    : ["/images/placeholder.jpg"]
                }
                title={listing.title}
                brand={listing.location?.name || listing.company?.name || ""}
                price={listing.price}
                priceSuffix={listing.priceSuffix}
                currency={listing.currency}
                link={`/details/${listing.id}`}
              />
            ))}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default ExclusiveCarousel;
