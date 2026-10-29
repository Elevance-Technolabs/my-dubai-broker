"use client";
"use no memo";

import InquiryForm from "../forms/InquiryForm";
import { Listing } from "@/types/listing";

interface AgentSidebarProps {
  listing: Listing;
}

const AgentSidebar = ({ listing }: AgentSidebarProps) => {
  const contactName = listing.company?.name || listing.seller?.name || "MyDubaiBroker";

  return (
    <div className="sticky top-24 bg-white p-8 border border-slate-100 w-full h-fit">
      {/* Header Profile */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-15 h-15 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
          <span className="text-xl font-serif text-slate-400">
            {contactName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-sans font-semibold  text-slate-900 mb-1">
            {contactName}
          </h3>
          <p className="font-sans text-xs font-light text-slate-500 leading-tight">
            {listing.type.replace("_", " ")} Specialist
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <InquiryForm listingId={listing.id} />
    </div>
  );
};

export default AgentSidebar;
