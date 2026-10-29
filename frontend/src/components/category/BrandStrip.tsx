const LOGOS = [
  "/images/brands/logo2.svg",
  "/images/brands/logo3.svg",
  "/images/brands/logo4.svg",
  "/images/brands/logo-5.svg",
  "/images/brands/logo-6.svg",
];

const BrandStrip = ({ type, isYachts }: { type: string, isYachts?: boolean }) => {
  return (
    <div className="w-full border-b border-gray-100 bg-white py-8 overflow-hidden">
      <div className="container mx-auto px-6">
        {
          isYachts && (
            <div className="text-2xl font-serif py-5 font-light text-center w-full text-black">Trusted by Leading Yacht Brands</div>
          )
        }
        <div className="flex flex-wrap justify-between items-center gap-8 md:gap-12">
          {LOGOS.map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center  cursor-pointer h-12 w-32 md:w-40 relative"
            >
              <img
                src={logo}
                alt={`Brand logo ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandStrip;
