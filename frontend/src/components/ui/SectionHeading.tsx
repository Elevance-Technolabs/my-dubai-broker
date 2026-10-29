import { ReactNode } from "react";

interface SectionHeadingProps {
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  bottomSubtitle?: string;
  noDivider?: boolean;
}

const SectionHeading = ({
  title,
  subtitle,
  align = "left",
  light = false,
  bottomSubtitle,
  noDivider = false,
}: SectionHeadingProps) => (
  <div
    className={`mb-8 flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-start"
      }`}
  >
    {subtitle && (
      <span className="text-gold font-sans uppercase tracking-widest text-xs font-semibold mb-2 block">
        {subtitle}
      </span>
    )}

    <h2
      className={`text-3xl font-serif font-light ${light ? "text-white" : "text-slate-900"}`}
    >
      {title}
    </h2>

    {!noDivider && <div className="h-0.5 w-16 bg-gold mt-6"></div>}

    {bottomSubtitle && (
      <span className="text-[#555555] mt-3 font-sans text-md italic mb-2 block">
        {bottomSubtitle}
      </span>
    )}
  </div>
);

export default SectionHeading;
