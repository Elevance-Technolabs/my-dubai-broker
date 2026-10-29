import SectionHeading from "../../ui/SectionHeading";
import AssetCard from "../../ui/CategoryCard";
import { Anchor } from "lucide-react";

const NEW_YACHTS = [
    {
        id: 1,
        title: "Sunseeker 116",
        price: 12500000,
        year: "2026",
        condition: "Brand New",
        images: [
            "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1174&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=1600&auto=format&fit=crop",
        ],
    },
    {
        id: 2,
        title: "Azimut Grande 35M",
        price: 10950000,
        year: "2025",
        condition: "Noble Luxury",
        images: [
            "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=1244&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=1600&auto=format&fit=crop",
        ],
    },
    {
        id: 3,
        title: "Benetti Oasis 40M",
        price: 18500000,
        year: "2024",
        condition: "Oasis Deck",
        images: [
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1170&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=1600&auto=format&fit=crop",
        ],
    },
    {
        id: 4,
        title: "Riva 110 Dolcevita",
        price: 14200000,
        year: "2025",
        condition: "Italian Style",
        images: [
            "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=1244&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=1600&auto=format&fit=crop",
        ],
    },
];

const NewArrivals = () => {
    return (
        <div className="py-15 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-10">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-3xl">New</span>{" "}
                                <span className="font-light text-3xl">Arrivals</span>
                            </>
                        }
                        align="left"
                    />
                    <p className="text-base text-gray-600 mt-2">
                        The latest additions to our exclusive fleet.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {NEW_YACHTS.map((yacht) => (
                        <AssetCard
                            key={yacht.id}
                            title={yacht.title}
                            brand={yacht.condition}
                            price={yacht.price}
                            images={yacht.images}
                            currency="AED"
                            brandLabel={`${yacht.year} / `}
                            logo={<Anchor className="w-5 h-5 text-gold" />}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewArrivals;
