import React from "react";
import BrandStrip from "@/components/category/BrandStrip";
import CategoryListings from "@/components/category/CategoryListings";
import { Listing } from "@/types/listing";
import ServiceFeatures from "@/components/category/realEstate/ServiceFeatures";
import ExploreFurther from "@/components/category/ExploreFurther";
import SectionWrapper from "@/components/layout/SectionWrapper";

type Props = {
    type: string;
    dict: any;
    listings: Listing[];
};

const RealEstateListingView = ({ type, listings }: Props) => {
    return (
        <>
            {
                type !== "collectibles" && (
                    <SectionWrapper>
                        <BrandStrip type={type} />
                    </SectionWrapper>
                )
            }

            <SectionWrapper bg="bg-bg-light">
                <CategoryListings listings={listings} type={type} />
            </SectionWrapper>


            <SectionWrapper>
                <ServiceFeatures />
            </SectionWrapper>

            <SectionWrapper>
                <ExploreFurther type={type} />
            </SectionWrapper>
        </>
    );
};

export default RealEstateListingView;
