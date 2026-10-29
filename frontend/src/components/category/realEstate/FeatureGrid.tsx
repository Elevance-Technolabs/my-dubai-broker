import AssetCard from "@/components/ui/CategoryCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { REAL_ESTATE_FEATURES, CAR_FEATURES } from "@/data/category-data";
import { HomeIcon } from "lucide-react";

const PROJECTS = [
  {
    id: 1,
    title: "Dubai Creek Harbour",
    price: 1800000,
    brand: "Emaar",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Emaar Beachfront",
    price: 2500000,
    brand: "Emaar",
    image:
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "District One",
    price: 8500000,
    brand: "Meydan",
    image:
      "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?q=80&w=1074&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Tilal Al Ghaf",
    price: 3200000,
    brand: "Majid Al Futtaim",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
  },
];

type FeatureItem = {
  id: number;
  title: string;
  count: string;
  image: string;
};

type FeatureGridProps = {
  items?: FeatureItem[];
  type: string;
};

const FeatureGrid = ({ items, type }: FeatureGridProps) => {
  const titleBold = type === "realEstate" ? "Only" : "Popular";
  const titleLight =
    type === "realEstate" ? "what deserves to be seen" : "Cars";

  const displayItems =
    items ||
    (type === "cars" || type === "automotive"
      ? CAR_FEATURES
      : REAL_ESTATE_FEATURES);

  return (
    <div className="py-15">
      <div className="container mx-auto px-6">
        <SectionHeading
          title={
            <>
              <span className="font-semibold text-3xl">{titleBold}</span>{" "}
              <span className="font-light text-3xl">{titleLight}</span>
            </>
          }
          align="left"
        />

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROJECTS.map((project) => (
            <AssetCard
              key={project.id}
              title={project.title}
              brand={project.brand}
              price={"Price on request"}
              images={[project.image]}
              currency="AED"
              logo={<HomeIcon className="w-5 h-5 text-gold" />}
              isPriceOnRequest
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
