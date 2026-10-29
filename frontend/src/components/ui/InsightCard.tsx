"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "lucide-react";

interface InsightCardProps {
  image: string;
  title: React.ReactNode;
  excerpt: string;
  link?: string;
  readMoreText?: string;
  className?: string;
  subTitle?: string;
}

const InsightCard = ({
  image,
  title,
  excerpt,
  link = "#",
  readMoreText = "Read Article",
  className,
  subTitle,
}: InsightCardProps) => {
  return (
    <Link href={link} className={cn("group flex flex-col h-full", className)}>
      <div className="relative aspect-16/10 overflow-hidden mb-6">
        <img
          src={image}
          alt="Insight"
          className="w-full h-full object-cover ease-in-out transition-transform duration-400 group-hover:scale-102"
        />
      </div>

      <div className="flex flex-col grow p-3">
        <span className="text-text-sec font-sans text-xs tracking-widest mb-4 block text-start">
          {subTitle}
        </span>
        <h3 className="text-xl font-sans font-semibold text-[#1A1A1A] leading-tight mb-4">
          {title}
        </h3>

        <p className="text-[#555555] font-sans text-sm leading-relaxed mb-6 line-clamp-2">
          {excerpt}
        </p>

        <span
          className="mt-auto text-sm font-sans text-gold group-hover:underline transition-all underline-offset-4 flex items-center gap-2"
        >
          {readMoreText} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

export default InsightCard;
