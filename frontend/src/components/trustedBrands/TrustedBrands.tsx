import SectionHeading from "../ui/SectionHeading";
import { HomeDict } from "@/types/dictionary";

const logos = [
  { src: "/images/brands/logo1.svg", alt: "Brand 1" },
  { src: "/images/brands/logo2.svg", alt: "Brand 2" },
  { src: "/images/brands/logo3.svg", alt: "Brand 3" },
  { src: "/images/brands/logo4.svg", alt: "Brand 4" },
];

type TrustedBrandsProps = {
  t: HomeDict;
};

const TrustedBrands = ({ t }: TrustedBrandsProps) => {
  return (
    <section className="py-15">
      <div className="container mx-auto">
        <div className="mb-12">
          <SectionHeading
            title={
              <>
                <span className="font-bold">
                  {t.trustedBrands.heading.bold}
                </span>{" "}
                <span className="font-light">
                  {t.trustedBrands.heading.light}
                </span>
              </>
            }
            align="left"
          />
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="flex w-max animate-marquee gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500 hover:pause">
            {/* Tripling the list to ensure smooth infinite scroll */}
            {[...Array(3)].map((_, setIndex) => (
              <div key={`set-${setIndex}`} className="flex gap-16 items-center">
                {logos.map((logo, index) => (
                  <div
                    key={`logo-${setIndex}-${index}`}
                    className="h-12 md:h-15"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-full w-auto"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrands;
