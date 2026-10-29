"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface BackButtonProps {
  label?: string;
  className?: string;
}

const BackButton = ({ label = "Back", className }: BackButtonProps) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "flex items-center text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black transition-colors group",
        className,
      )}
    >
      <ArrowLeft
        size={14}
        className="mr-2 group-hover:-translate-x-1 transition-transform"
      />
      {label}
    </button>
  );
};

export default BackButton;
