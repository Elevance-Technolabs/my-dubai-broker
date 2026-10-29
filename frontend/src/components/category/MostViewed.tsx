import SectionHeading from "../ui/SectionHeading";
import AssetCard from "../ui/CategoryCard";
import { HomeIcon, Car, Anchor } from "lucide-react";
import { MOST_VIEWED_DATA } from "@/data/category-data";

type MostViewedProps = {
    category: keyof typeof MOST_VIEWED_DATA;
};

const MostViewed = ({ category }: MostViewedProps) => {
    const data = MOST_VIEWED_DATA[category];

    if (!data) return null;

    const getIcon = () => {
        switch (category) {
            case "cars":
                return <Car className="w-5 h-5 text-gold" strokeWidth={1.5} />;
            case "yachts":
                return <Anchor className="w-5 h-5 text-gold" strokeWidth={1.5} />;
            case "realEstate":
            default:
                return <HomeIcon className="w-5 h-5 text-gold" />;
        }
    };

    const gridCols = category === "cars" ? "md:grid-cols-3 lg:grid-cols-5" : "lg:grid-cols-4";

    return (
        <div className="py-15">
            <div className="container mx-auto px-6">
                <div className="mb-10">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-3xl">{data.titleBold}</span>{" "}
                                <span className="font-light text-3xl">{data.titleLight}</span>
                            </>
                        }
                        align="left"
                        bottomSubtitle={data.bottomSubtitle}
                    />
                </div>

                {/* Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
                    {data.items.map((item) => (
                        <AssetCard
                            key={item.id}
                            title={item.title}
                            brand={item.brand}
                            brandLabel={category === "cars" ? "" : "by"}
                            price={item.price}
                            images={[item.image]}
                            currency="AED"
                            logo={getIcon()}
                            isPriceOnRequest={category === "realEstate" && typeof item.price === "string"}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MostViewed;
