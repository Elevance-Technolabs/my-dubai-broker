"use client";

import React, { useState } from "react";
import ListingViewHeader from "./ListingViewHeader";
import ListingFilterBar from "./ListingFilterBar";
import FilterModal from "./FilterModal";
import MainListingCard from "./MainListingCard";
import ListingGridView from "./ListingGridView";
import SectionWrapper from "../layout/SectionWrapper";
import { Listing } from "@/types/listing";

interface ListingViewProps {
    category: string;
    title: string;
    listings: Listing[];
}

const ListingView = ({ category, title, listings }: ListingViewProps) => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [featured, ...rest] = listings;

    return (
        <>
            <SectionWrapper>
                <ListingViewHeader title={title} />
                <ListingFilterBar
                    onOpenFilters={() => setIsFilterModalOpen(true)}
                    category={category}
                />
            </SectionWrapper>
            <SectionWrapper bg="bg-bg-light">
                <MainListingCard listing={featured} />
                <ListingGridView listings={rest.length ? rest : listings} />
            </SectionWrapper>

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={(filters) => {
                    console.log("Applying filters:", filters);
                    setIsFilterModalOpen(false);
                }}
            />
        </>
    );
};

export default ListingView;
