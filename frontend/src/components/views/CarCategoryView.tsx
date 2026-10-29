import React from "react";
import BrandStrip from "@/components/category/BrandStrip";
import CategoryListings from "@/components/category/CategoryListings";
import { Listing } from "@/types/listing";
import CarServiceFeatures from "@/components/category/car/CarServiceFeatures";
import ExploreFurther from "@/components/category/ExploreFurther";
import SectionWrapper from "@/components/layout/SectionWrapper";

type Props = {
    type: string;
    dict: any;
    listings: Listing[];
};

const CarListingView = ({ type, listings }: Props) => {
    return (
        <>
            <SectionWrapper>
                <BrandStrip type={type} />
            </SectionWrapper>



            <SectionWrapper>
                <CategoryListings listings={listings} type={type} />
            </SectionWrapper>



            <SectionWrapper bg="bg-bg-light">
                <CarServiceFeatures />
            </SectionWrapper>

            <SectionWrapper>
                <ExploreFurther type={type} />
            </SectionWrapper>
        </>
    );
};

export default CarListingView;
