import React from "react";
import { CheckCircle2, Eye, Mail } from "lucide-react";

const ServiceFeatures = () => {
  const features = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-gold" strokeWidth={1.5} />,
      title: "Curated Listings Only",
      description:
        "Every listing on MyDubaiBroker is reviewed before it goes live. We prioritize quality, rarity, and relevance - never volume.",
      list: ["Verified submissions", "Selective approvals", "No mass uploads"],
    },
    {
      icon: <Eye className="w-6 h-6 text-gold" strokeWidth={1.5} />,
      title: "Find What Matters",
      description:
        "Properties are discovered through curated collections, editorial selections, and refined browsing - designed to surface only what truly matters.",
      list: [
        "Editor's Choice",
        "Signature collections",
        "Focused browsing, no clutter",
      ],
    },
    {
      icon: <Mail className="w-6 h-6 text-gold" strokeWidth={1.5} />,
      title: "Direct & Transparent Contact",
      description:
        "Connect directly with verified sellers, brokers, or companies. No middle noise. No duplicated listings.",
      list: ["Direct enquiries", "Verified accounts", "Faster conversations"],
    },
  ];

  return (
    <div className="py-20 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start text-left">
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-serif text-slate-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm font-sans leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.list.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-slate-400 text-xs font-sans flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceFeatures;
