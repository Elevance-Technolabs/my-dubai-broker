import { Bed, Bath, Move, MapPin, Check, Car, Gauge, Ruler, Users } from "lucide-react";
import PropertyAgent from "./PropertyAgent";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Listing } from "@/types/listing";

interface PropertyInfoProps {
  listing: Listing;
}

const getKeyStats = (listing: Listing) => {
  switch (listing.type) {
    case "REAL_ESTATE":
      return [
        { icon: Bed, label: `${listing.bedrooms} Bedrooms` },
        { icon: Bath, label: `${listing.bathrooms} Bathrooms` },
        { icon: Move, label: `${listing.builtUpArea} sqft` },
      ];
    case "CAR":
      return [
        { icon: Car, label: `${listing.brand} ${listing.model}` },
        { icon: Gauge, label: `${listing.mileage.toLocaleString()} km` },
        { icon: Ruler, label: listing.transmission },
      ];
    case "YACHT":
      return [
        { icon: Ruler, label: `${listing.length} ft length` },
        { icon: Users, label: `${listing.cabins} Cabins` },
        { icon: Car, label: listing.make },
      ];
    case "JET":
    case "HELICOPTER":
      return [
        { icon: Car, label: `${listing.manufacturer} ${listing.model}` },
        { icon: Users, label: `${listing.passengerCapacity ?? listing.seating ?? "-"} Seats` },
        { icon: Ruler, label: `${listing.range ?? "-"} nm range` },
      ];
    default:
      return [];
  }
};

const getFeatures = (listing: Listing): string[] => {
  switch (listing.type) {
    case "REAL_ESTATE":
      return [
        ...(listing.amenities || []),
        ...(listing.indoor || []),
        ...(listing.outdoor || []),
        ...(listing.community || []),
      ];
    case "CAR":
      return listing.options || [];
    case "YACHT":
      return listing.navigation || [];
    default:
      return [];
  }
};

const PropertyInfo = ({ listing }: PropertyInfoProps) => {
  const stats = getKeyStats(listing);
  const features = getFeatures(listing);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex-1">
          <div className="bg-[#F0F0F0] text-black text-[10px] tracking-widest uppercase px-3 py-1 w-fit mb-4">
            {listing.type.replace("_", " ")}
          </div>
          <h1 className="text-4xl font-canela text-slate-900 leading-tight mb-6">
            {listing.title}
          </h1>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center items-baseline w-full">
            <div>
              <div className="flex flex-wrap gap-6 text-[#555555] font-satoshi text-sm items-center">
                {stats.map(({ icon: Icon, label }, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon className="w-5 h-5" /> {label}
                  </div>
                ))}
              </div>
              {listing.location?.name && (
                <div className="flex items-center py-3 gap-2 text-[#555555] text-xs mt-4 uppercase tracking-widest">
                  <MapPin className="w-4 h-4" /> {listing.location.name}
                </div>
              )}
            </div>
            <div className="text-2xl font-sans font-bold text-slate-900 whitespace-nowrap mt-4 lg:mt-0">
              <span className="text-base font-light">{listing.currency}</span>{" "}
              {formatPrice(listing.price, listing.currency, "en-AE", false)}
              {listing.priceSuffix}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full mb-12" />

      {/* Overview */}
      <div className="mb-12">
        <h2 className="text-3xl font-canela text-slate-900 mb-6">
          <span className="font-bold border-b-2 pb-2 border-b-gold">Asset</span> Overview
        </h2>
        <div className="text-slate-600 font-satoshi leading-relaxed space-y-4 font-light">
          {listing.description
            .split("\n")
            .filter((paragraph) => paragraph.trim())
            .map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
        </div>
      </div>

      {/* Video Tour */}
      {listing.media.video && (
        <div className="mb-12">
          <h2 className="text-3xl font-canela text-slate-900 mb-9">
            <span className="font-bold border-b-2 pb-2 border-b-gold">Asset</span> Tour
          </h2>
          <div className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer shadow-xl bg-black">
            <iframe
              src={listing.media.video}
              title="Asset video tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-canela text-slate-900 mb-6">
            <span className="font-bold border-b-2 pb-2 border-b-gold">Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
            {features.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-slate-600 font-satoshi font-light text-sm"
              >
                <Check className="w-4 h-4 text-gold" /> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neighborhood / Location */}
      {listing.location?.lat && listing.location?.lng && (
        <div className="mb-12">
          <h2 className="text-3xl font-canela text-slate-900 mb-6">
            <span className="font-bold border-b-2 md:pb-2 border-b-gold">Discover</span>{" "}
            the Location
          </h2>
          <p className="text-slate-500 text-sm my-8">{listing.location.name}</p>

          <div className="relative w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <iframe
              src={`https://www.google.com/maps?q=${listing.location.lat},${listing.location.lng}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      <PropertyAgent listing={listing} />
    </div>
  );
};

export default PropertyInfo;
