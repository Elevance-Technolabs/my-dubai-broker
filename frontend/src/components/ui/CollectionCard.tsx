import { cn } from "@/lib/utils/cn";
import React from "react";

interface CollectionCardProps {
  image: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  className?: string; // For height, margin, etc.
}

const CollectionCard = ({
  image,
  title,
  subtitle,
  onClick,
  className,
}: CollectionCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer h-[420px]",
        className,
      )}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform ease-in-out duration-400 group-hover:scale-102"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black from-0% via-black/40 via-40% to-transparent to-100%" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col items-start">
        <h3 className="text-2xl font-serif text-white mb-2 leading-tight drop-shadow-md">
          {title}
        </h3>
        <p className="text-white/70 pt-1 font-sans text-[10px] uppercase tracking-[0.2em]">
          {subtitle}
        </p>
        <div className="w-8 h-px bg-gold my-3 group-hover:w-16 transition-all duration-300"></div>
      </div>
    </div>
  );
};

export default CollectionCard;
