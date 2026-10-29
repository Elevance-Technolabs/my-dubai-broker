import { Car, Cuboid as Cube } from "lucide-react";
import React from "react";
import AssetCard from "../../ui/CategoryCard";
import SectionHeading from "../../ui/SectionHeading";

const CARS = [
  {
    id: 1,
    title: "Bugatti Chiron Sport",
    modal: "2024 / Carmel Edition",
    price: "14,500,000",
    image:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Mercedes-Maybach S680",
    modal: "2023 / Carbon Package",
    price: "1,350,000",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Ferrari 250 GTO Tribute",
    modal: "2024 / Grand Edition",
    price: "35,000,000",
    image:
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Porsche 918 Spyder",
    modal: "2024 / Cabriolet",
    price: "7,200,000",
    image:
      "https://images.unsplash.com/photo-1596450886763-6f9b7f3cbd0a?q=80&w=1170&auto=format&fit=crop",
  },
];

const CarsExclusives = () => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <SectionHeading
            title={
              <>
                <span className="font-bold text-3xl">Only what deserves</span>{" "}
                <span className="font-light text-3xl">to be seen</span>
              </>
            }
            align="left"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {CARS.map((car) => (
            <AssetCard
              key={car.id}
              images={[car.image]}
              title={car.title}
              brand={car.modal}
              price={car.price.replace(/,/g, "")}
              currency="AED"
              link="#"
              logo={<Car className="w-5 h-5 text-gold" strokeWidth={1.5} />}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarsExclusives;
