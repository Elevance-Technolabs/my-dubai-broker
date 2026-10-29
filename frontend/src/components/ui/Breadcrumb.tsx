"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbProps {
  customTitles?: Record<string, string>;
  excludePaths?: string[];
  className?: string;
}

const Breadcrumb = ({
  customTitles = {},
  excludePaths = [],
  className,
}: BreadcrumbProps) => {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const asPathNestedRoutes = pathname
      .replace(/\/$/, "")
      .split("/")
      .filter((v) => v.length > 0 && !excludePaths.includes(v));

    return asPathNestedRoutes.map((segment, index) => {
      const href = `/${asPathNestedRoutes.slice(0, index + 1).join("/")}`;
      const label = customTitles[segment] || segment.replace(/-/g, " ");

      return {
        href,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        isLast: index === asPathNestedRoutes.length - 1,
      };
    });
  }, [pathname, customTitles, excludePaths]);

  // Don't render on home page if desired, or keep to show root
  if (pathname === "/") return null;

  return (
    <nav aria-label="breadcrumb" className={cn("w-full py-4", className)}>
      <ol className="flex flex-wrap items-center gap-3 text-xs! md:text-base font-sans text-slate-500">
        {/* Home Root Link */}
        <li className="flex items-center hover:text-gold transition-colors duration-200">
          <Link href="/">
            <span>Home</span>
          </Link>
        </li>

        {breadcrumbs.map((item) => (
          <li key={item.href} className="flex items-center gap-3">
            /

            {item.isLast ? (
              <span
                className="font-normal text-slate-900 truncate max-w-[200px]"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-gold transition-colors duration-200 capitalize"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
