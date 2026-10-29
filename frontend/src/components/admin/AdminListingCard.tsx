import { Building2, Eye, FileText, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { computeCompleteness, formatListingPrice } from "@/lib/utils/listingCompleteness";

const STATUS_TONE: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
  CHANGES_REQUIRED: "bg-orange-50 text-orange-700 border-orange-100",
};
const DEFAULT_TONE = "bg-amber-50 text-amber-700 border-amber-100";

const scoreTone = (score: number) =>
  score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-lime-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";

export default function AdminListingCard({
  listing,
  onOpen,
}: {
  listing: any;
  onOpen: () => void;
}) {
  const { score, rating, missing } = computeCompleteness(listing);
  const photo = listing.media?.photos?.[0];
  const location = [listing.location?.area, listing.location?.city].filter(Boolean).join(", ");

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col md:flex-row"
    >
      <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0 bg-slate-100">
        {photo ? (
          <img src={photo} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="text-slate-300" size={40} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 p-5 flex flex-col gap-3 justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
              STATUS_TONE[listing.approvalStatus] ?? DEFAULT_TONE,
            )}
          >
            {listing.approvalLabel}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
            {listing.publicationLabel}
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
            {listing.categoryLabel}
            {listing.publicRef ? ` · ${listing.publicRef}` : ""}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 truncate">{listing.title}</h3>
          <p className="text-sm text-slate-900 font-medium mt-1">
            {formatListingPrice(listing.pricing)}
            <span className="text-slate-400 font-normal"> · {listing.pricing?.offeringLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-2"><Building2 size={12} /> {listing.company?.name ?? "Unknown company"}</p>
          <p className="flex items-center gap-2"><User size={12} /> {listing.agent?.name ?? "—"}</p>
          {location && <p className="flex items-center gap-2"><MapPin size={12} /> {location}</p>}
        </div>
      </div>

      <div className="md:w-72 shrink-0 p-5 md:border-l border-t md:border-t-0 border-slate-100 flex flex-col gap-3 justify-center">
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold mb-1.5">
            <span className="text-slate-400">Completeness</span>
            <span className="text-slate-900">{score}/100 · {rating}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={cn("h-full rounded-full", scoreTone(score))} style={{ width: `${score}%` }} />
          </div>
          {missing.length > 0 && (
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
              Missing: {missing.slice(0, 3).join(" · ")}
              {missing.length > 3 ? ` +${missing.length - 3} more` : ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest font-bold">
          <div>
            <p className="text-slate-400">Quality</p>
            <p className="text-slate-900 mt-0.5">
              {listing.quality ? `${listing.quality.score} · ${listing.quality.rating}` : "Not scored"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Visibility</p>
            <p className="text-slate-900 mt-0.5">{listing.visibility?.level ?? "Not ranked"}</p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center px-5 border-l border-slate-100 text-slate-400">
        <Eye size={18} />
      </div>
    </div>
  );
}
