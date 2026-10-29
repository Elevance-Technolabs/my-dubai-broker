import { cn } from "@/lib/utils/cn";
import { CSSProperties } from "react";

type SectionWrapperProps = {
  children: React.ReactNode;
  bg?: CSSProperties["backgroundColor"];
  borderTop?: boolean;
};

export default function SectionWrapper({
  children,
  bg = "",
  borderTop = false,

}: SectionWrapperProps) {
  return (
    <section
      className={cn(bg, borderTop ? "border-t-2 border-t-gray-300" : "")}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden xl:block xl:col-span-1" />

          <div className="col-span-12 xl:col-span-10">
            {children}
          </div>

          <div className="hidden xl:block xl:col-span-1" />
        </div>
      </div>
    </section>
  );
}
