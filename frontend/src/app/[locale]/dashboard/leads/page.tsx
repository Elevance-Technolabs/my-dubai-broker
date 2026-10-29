"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Copy } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { LeadService, type Lead } from "@/services/lead.service";
import { COMPANY_MANAGEMENT_ROLES, UserRole } from "@/types/enums";
import { cn } from "@/lib/utils/cn";

const STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "APPOINTMENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  APPOINTMENT: "Appointment",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

const STAGE_TONE: Record<string, string> = {
  NEW: "bg-amber-50 text-amber-700 border-amber-100",
  CONTACTED: "bg-blue-50 text-blue-700 border-blue-100",
  QUALIFIED: "bg-indigo-50 text-indigo-700 border-indigo-100",
  APPOINTMENT: "bg-purple-50 text-purple-700 border-purple-100",
  NEGOTIATION: "bg-orange-50 text-orange-700 border-orange-100",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-100",
  LOST: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function LeadsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const canSeeAllCompanyLeads = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchLeads = async () => {
    setIsLoading(true);
    const stage = filter === "ALL" ? undefined : filter;
    const response = canSeeAllCompanyLeads
      ? await LeadService.getCompanyLeads(stage)
      : await LeadService.getMyLeads(stage);

    if (response.success) {
      setLeads(response.data?.leads || []);
    } else {
      toast.error(response.error || "Failed to load leads");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, canSeeAllCompanyLeads]);

  const handleStageChange = async (id: string, stage: string) => {
    const response = await LeadService.updateStage(id, stage);
    if (response.success) {
      toast.success("Stage updated");
      fetchLeads();
    } else {
      toast.error(response.error || "Failed to update stage");
    }
  };

  const logContact = async (id: string, type: "CALL" | "WHATSAPP" | "EMAIL") => {
    const response = await LeadService.addActivity(id, type);
    if (response.success) {
      toast.success("Logged");
      fetchLeads();
    } else {
      toast.error(response.error || "Failed to log activity");
    }
  };

  return (
    <div className="animate-fade-in-up max-w-6xl mx-auto">
      <div className="mb-12 border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif text-luxury-black">Leads</h2>
          <p className="text-gray-400 mt-2 font-light text-sm tracking-wide">
            {canSeeAllCompanyLeads
              ? "Enquiries across your team."
              : "Enquiries assigned to you."}
          </p>
        </div>

        <div className="flex flex-wrap bg-gray-50 p-1 border border-gray-200 rounded-xl">
          {(["ALL", ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-2 text-[9px] font-bold tracking-widest uppercase rounded-lg transition-all",
                filter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {s === "ALL" ? "All" : STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm uppercase tracking-widest">
          No leads yet
        </div>
      ) : (
        <div className="border border-gray-100 divide-y divide-gray-100">
          {leads.map((lead) => (
            <div key={lead.id} className="px-6 py-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-luxury-black">
                      {lead.customerName}
                    </p>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                        STAGE_TONE[lead.stage],
                      )}
                    >
                      {STAGE_LABELS[lead.stage] ?? lead.stage}
                    </span>
                    {lead.isDuplicate && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                        <Copy size={9} /> Possible duplicate
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 truncate">
                    {lead.listing.title} &middot; {lead.listing.publicRef}
                  </p>
                  {lead.message && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 max-w-xl">
                      {lead.message}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
                    {lead.customerPhone && <span>{lead.customerPhone}</span>}
                    {lead.customerEmail && <span>{lead.customerEmail}</span>}
                    {canSeeAllCompanyLeads && lead.assignedTo && (
                      <span>Assigned to {lead.assignedTo.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {lead.customerPhone && (
                    <button
                      onClick={() => logContact(lead.id, "CALL")}
                      className="text-gray-400 hover:text-luxury-black transition-colors"
                      title="Log a call"
                    >
                      <Phone size={16} />
                    </button>
                  )}
                  {lead.customerPhone && (
                    <button
                      onClick={() => logContact(lead.id, "WHATSAPP")}
                      className="text-gray-400 hover:text-luxury-black transition-colors"
                      title="Log a WhatsApp message"
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                  {lead.customerEmail && (
                    <button
                      onClick={() => logContact(lead.id, "EMAIL")}
                      className="text-gray-400 hover:text-luxury-black transition-colors"
                      title="Log an email"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  <select
                    value={lead.stage}
                    onChange={(e) => handleStageChange(lead.id, e.target.value)}
                    className="text-[10px] uppercase tracking-widest border border-gray-200 px-2 py-2 bg-white focus:outline-none focus:border-luxury-gold"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
