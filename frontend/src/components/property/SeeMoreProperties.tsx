import { Home } from "lucide-react";
import AssetCard from "../ui/CategoryCard";
import SectionHeading from "../ui/SectionHeading";
import { Listing } from "@/types/listing";

interface SeeMorePropertiesProps {
    listings: Listing[];
}

const SeeMoreProperties = ({ listings }: SeeMorePropertiesProps) => {
    if (!listings.length) return null;

    return (
        <div className="py-20 bg-white">
            <div className="mb-12">
                <SectionHeading
                    title={
                        <>
                            <span className="font-bold text-3xl font-serif">See</span>{" "}
                            <span className="font-light text-3xl font-serif">More</span>
                        </>
                    }
                    align="left"
                />
                <div className="h-px bg-[#E5E5E5] w-full mt-6 mb-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                    <AssetCard
                        key={listing.id}
                        images={listing.media.photos.length ? listing.media.photos : ["/images/placeholder.jpg"]}
                        title={listing.title}
                        brand={listing.location?.name || listing.company?.name || ""}
                        brandLabel=""
                        price={listing.price}
                        currency={listing.currency}
                        link={`/details/${listing.id}`}
                        logo={<Home className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                    />
                ))}
            </div>
        </div>
    );
};

export default SeeMoreProperties;
