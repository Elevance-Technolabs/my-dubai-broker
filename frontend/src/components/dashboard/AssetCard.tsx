import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type AssetCardProps = {
  id: string;
  categoryLabel: string;
  title: string;
  price: string;
  image: string;
  approvalStatus: string;
  statusLabel: string;
  date: string;
  rejectionReason?: string | null;
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-luxury-black",
  PENDING_REVIEW: "bg-luxury-black",
  CHANGES_REQUIRED: "bg-amber-600",
  APPROVED: "bg-luxury-gold",
  REJECTED: "bg-rose-600",
};

const AssetCard = ({
  id,
  categoryLabel,
  title,
  price,
  image,
  approvalStatus,
  statusLabel,
  date,
  rejectionReason,
}: AssetCardProps) => {
  return (
    <Link href={`/listings/${id}`} className="block h-full group">
      <div className="bg-white h-full transition-all duration-500 ease-out hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-100 transform-gpu cursor-pointer">
        <div className="relative aspect-4/3 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 right-4 z-20">
            <span
              className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest text-white backdrop-blur-sm ${STATUS_CLASS[approvalStatus] ?? "bg-gray-400"}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-6">
            <p className="text-[9px] text-luxury-gold uppercase tracking-widest mb-2">
              {categoryLabel}
            </p>
            <h3 className="text-xl font-serif text-luxury-black truncate mb-2 group-hover:text-luxury-gold transition-colors duration-500">
              {title}
            </h3>
            {rejectionReason && approvalStatus === "REJECTED" && (
              <p
                className="text-[10px] text-rose-500 font-medium mt-1 line-clamp-2 leading-tight"
                title={rejectionReason}
              >
                <span className="font-bold">Reason:</span> {rejectionReason}
              </p>
            )}
          </div>
          <p className="text-lg font-light text-gray-500 mb-6 border-b border-gray-50 pb-6">
            {price}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase text-gray-300 tracking-widest">
              Listed {date}
            </span>
            <button className="text-[9px] uppercase tracking-widest text-luxury-black hover:text-luxury-gold transition-colors flex items-center">
              View Details <ChevronRight size={10} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AssetCard;
