import BrandStrip from "@/components/category/BrandStrip";
import PopularSearches from "@/components/category/PopularSearches";
import CategoryListings from "@/components/category/CategoryListings";
import { Listing } from "@/types/listing";
import SectionWrapper from "@/components/layout/SectionWrapper";
import YachtingEssentials from "../category/yatch/YachtingEssentials";

type Props = {
    type: string;
    dict: any;
    listings: Listing[];
};

const YachtListingView = ({ type, dict, listings }: Props) => {
    return (
        <>
            <SectionWrapper>
                <BrandStrip type={type} isYachts />
            </SectionWrapper>

            <SectionWrapper>
                <PopularSearches category="yachts" dict={dict} />
            </SectionWrapper>


            <SectionWrapper bg="bg-bg-light">
                <CategoryListings listings={listings} type={type} />
            </SectionWrapper>


            <SectionWrapper>
                <YachtingEssentials dict={dict} />
            </SectionWrapper>
        </>
    );
};

export default YachtListingView;
