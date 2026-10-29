import Link from "next/link";
import SectionHeading from "../ui/SectionHeading";
import CategoryCard from "../ui/CategoryCard";
import { HomeIcon, Car, Anchor, Plane } from "lucide-react";
import { Listing } from "@/types/listing";

type CategoryListingsProps = {
    listings: Listing[];
    type: string;
};

const CategoryListings = ({ listings, type }: CategoryListingsProps) => {
    const getIcon = () => {
        const cls = "w-5 h-5 text-gold";
        switch (type) {
            case "cars":
            case "automotive":
                return <Car className={cls} strokeWidth={1.5} />;
            case "yachts":
                return <Anchor className={cls} strokeWidth={1.5} />;
            case "jets":
            case "helicopters":
                return <Plane className={cls} strokeWidth={1.5} />;
            default:
                return <HomeIcon className={cls} />;
        }
    };

    return (
        <div className="py-15">
            <div className="container mx-auto px-6">
                <div className="mb-10">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-3xl">Latest</span>{" "}
                                <span className="font-light text-3xl">Listings</span>
                            </>
                        }
                        align="left"
                        bottomSubtitle="Approved listings available now"
                    />
                </div>

                {listings.length === 0 ? (
                    <p className="text-[#8E8E8E] font-sans text-sm">
                        No listings available in this category yet.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {listings.map((listing) => (
                                <CategoryCard
                                    key={listing.id}
                                    images={listing.media.photos.length ? listing.media.photos : ["/images/placeholder.jpg"]}
                                    title={listing.title}
                                    brand={listing.location?.name || listing.company?.name || ""}
                                    price={listing.price}
                                    priceSuffix={listing.priceSuffix}
                                    currency={listing.currency}
                                    link={`/details/${listing.id}`}
                                    logo={getIcon()}
                                />
                            ))}
                        </div>

                        <div className="mt-10">
                            <Link
                                href={`/all-listings/${type}`}
                                className="inline-block text-[#1A1A1A] font-sans text-xs border-b border-[#1A1A1A] pb-0.5 hover:text-gold hover:border-gold transition-colors duration-300"
                            >
                                View all
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryListings;
