import SectionHeading from "../ui/SectionHeading";
import { HomeDict } from "@/types/dictionary";
import CollectionCard from "../ui/CollectionCard";
import Link from "next/link";

const COLLECTIONS = [
  { id: 1, image: "/images/hero/img1.jpg", number: "2,847", type: "realEstate" },
  { id: 2, image: "/images/collections/car.jpg", number: "1,532", type: "cars" },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1600&auto=format&fit=crop",
    number: "387",
    type: "yatchs"
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1600&auto=format&fit=crop",
    number: "142",
    type: "jets"
  },
];

type CollectionsProps = {
  t: HomeDict;
};

const Collections = ({ t }: CollectionsProps) => {
  return (
    <div className="py-15">
      <SectionHeading
        title={
          <>
            <span className="font-semibold">{t.collections.heading.bold}</span>{" "}
            <span className="font-light">{t.collections.heading.light}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
        {COLLECTIONS.map((item, index) => {
          const itemText = t.collections.items[index];
          return (
            <Link href={`/category/${item.type}`} key={item.id}>
              <CollectionCard
                key={item.id}
                image={item.image}
                title={itemText?.title}
                subtitle={itemText?.count.replace("{{count}}", item.number)}
                className="h-[400px] w-full mx-auto"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Collections;
