import JetAircraftCategories from "@/components/category/jet/JetAircraftCategories";
import JetManufacturers from "@/components/category/jet/JetManufacturers";
import CuratorsNote from "@/components/category/jet/CuratorsNote";
import JetEssentials from "@/components/category/jet/JetEssentials";
import SectionWrapper from "@/components/layout/SectionWrapper";
import CategoryListings from "@/components/category/CategoryListings";
import { Listing } from "@/types/listing";

type Props = {
    type: string;
    dict: any;
    listings: Listing[];
};

const JetListingView = ({ type, dict, listings }: Props) => {
    return (
        <>


            <SectionWrapper>
                <CategoryListings listings={listings} type={type} />
            </SectionWrapper>


            <SectionWrapper>
                <JetAircraftCategories dict={dict} />
            </SectionWrapper>

            <SectionWrapper bg="bg-bg-light">
                <CuratorsNote dict={dict} />
            </SectionWrapper>

            <SectionWrapper>
                <JetManufacturers dict={dict} />
            </SectionWrapper>

            <SectionWrapper>
                <JetEssentials dict={dict} />
            </SectionWrapper>
        </>
    );
};

export default JetListingView;
