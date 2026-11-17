"use client";
"use no memo";

import InquiryForm from "../forms/InquiryForm";
import { Listing } from "@/types/listing";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { trackListingEvent } from "@/lib/tracking";

interface AgentSidebarProps {
  listing: Listing;
}

const AgentSidebar = ({ listing }: AgentSidebarProps) => {
  const contactName = listing.company?.name || listing.seller?.name || "MyDubaiBroker";
  const phone = listing.contact?.phone?.trim();
  const email = listing.contact?.email?.trim();

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

      {/* Direct contact — each click is recorded for listing performance */}
      {(phone || email) && (
        <div className="grid grid-cols-3 gap-2 mb-8">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => trackListingEvent(listing.id, "CALL_CLICK")}
              className="flex flex-col items-center gap-1 py-3 border border-slate-200 text-[10px] uppercase tracking-widest text-slate-700 hover:border-gold"
            >
              <Phone size={16} /> Call
            </a>
          )}
          {phone && (
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackListingEvent(listing.id, "WHATSAPP_CLICK")}
              className="flex flex-col items-center gap-1 py-3 border border-slate-200 text-[10px] uppercase tracking-widest text-slate-700 hover:border-gold"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              onClick={() => trackListingEvent(listing.id, "EMAIL_CLICK")}
              className="flex flex-col items-center gap-1 py-3 border border-slate-200 text-[10px] uppercase tracking-widest text-slate-700 hover:border-gold"
            >
              <Mail size={16} /> Email
            </a>
          )}
        </div>
      )}

      {/* Form Fields */}
      <InquiryForm listingId={listing.id} />
    </div>
  );
};

export default AgentSidebar;
