import { HomeDict } from "@/types/dictionary";
import Link from "next/link";
import { Locale } from "@/i18n/config";

type QuickLinksProps = {
  t: HomeDict;
  locale: Locale;
};

const QuickLinks = ({ t, locale }: QuickLinksProps) => {
  // Map keys to routes for functional navigation
  const categoryRoutes: Record<string, string> = {
    neighborhoods: "realEstate",
    explore: "realEstate", // Default to realEstate for explore for now
    vehicles: "cars",
    jets: "jets",
    yachts: "yachts"
  };

  const categories = Object.entries(t.quickLinks.categories);

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto">
        <div className="mb-12">
          <h2 className={`text-3xl font-serif font-light text-slate-900`}>
            <span className="font-bold">{t.quickLinks.heading.bold}</span>{" "}
            <span className="font-light">{t.quickLinks.heading.light}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {categories.map(([key, cat], idx) => {
            const categoryKey = categoryRoutes[key] || "realEstate";

            return (
              <div key={idx} className="flex flex-col">
                <h4 className="font-sans text-sm font-semibold mb-6 text-slate-900">
                  {cat.title}
                </h4>
                <ul className="space-y-4 mb-6 flex-1">
                  {cat.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        href={`/${locale}/category/${categoryKey}`}
                        className="font-sans text-slate-500 hover:text-gold text-xs transition-colors block"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/category/${categoryKey}`}
                  className="text-gold font-sans text-xs hover:underline mt-auto"
                >
                  {t.quickLinks.viewAll}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickLinks;
