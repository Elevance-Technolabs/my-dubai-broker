"use client";

import React from "react";
import CategoryCard from "../ui/CategoryCard";
import { Home } from "lucide-react";
import { Listing } from "@/types/listing";

interface ListingGridViewProps {
    listings: Listing[];
}

const ListingGridView = ({ listings }: ListingGridViewProps) => {
    if (!listings.length) {
        return (
            <div className="py-20 text-center text-slate-400 font-sans text-sm">
                No approved listings available in this category yet.
            </div>
        );
    }

    return (
        <div className="space-y-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
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
                        logo={<Home className="text-gold" />}
                    />
                ))}
            </div>

            {/* Most Viewed Section */}
            {listings.length > 4 && (
                <section className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold font-satoshi mb-2">Most Viewed</h2>
                        <p className="text-sm text-slate-400 font-sans">Properties Near By Your Locality</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {listings.slice(0, 4).map((listing) => (
                            <CategoryCard
                                key={`mv-${listing.id}`}
                                images={listing.media.photos.length ? listing.media.photos : ["/images/placeholder.jpg"]}
                                title={listing.title}
                                brand={listing.location?.name || listing.company?.name || ""}
                                price={listing.price}
                                priceSuffix={listing.priceSuffix}
                                currency={listing.currency}
                                link={`/details/${listing.id}`}
                                logo={<Home className="text-gold" />}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ListingGridView;
