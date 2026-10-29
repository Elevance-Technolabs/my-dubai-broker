import SectionHeading from "../ui/SectionHeading";
import { Listing } from "@/types/listing";

interface PropertyAgentProps {
  listing: Listing;
}

const PropertyAgent = ({ listing }: PropertyAgentProps) => {
  const listedByName = listing.company?.name || listing.seller?.name || "MyDubaiBroker";

  return (
    <>
      <SectionHeading
        title={
          <>
            <span className="font-bold text-2xl font-serif pb-1">Listed</span>{" "}
            <span className="font-light text-2xl font-serif">By</span>
          </>
        }
        align="left"
      />
      <div className="bg-[#FDFDFD] border border-slate-100 p-8 mt-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
            <span className="text-2xl font-serif text-slate-400">
              {listedByName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col justify-between items-start mb-2">
              <div>
                <h4 className="text-xl font-sans text-slate-900 mb-1">
                  {listedByName}
                </h4>
                {listing.contact?.email && (
                  <p className="text-xs text-slate-400 font-satoshi font-light mb-2">
                    {listing.contact.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyAgent;
