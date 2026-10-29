"use client";

import React from "react";
import Breadcrumb from "../ui/Breadcrumb";

interface ListingViewHeaderProps {
    title: string;
}

const ListingViewHeader = ({ title }: ListingViewHeaderProps) => {
    return (
        <div className="pt-30 pb-8 bg-white">
            <Breadcrumb className="mb-8" />
            <h1 className="text-4xl font-medium font-canela text-[#1A1A1A]">
                {title}
            </h1>
        </div>
    );
};

export default ListingViewHeader;
