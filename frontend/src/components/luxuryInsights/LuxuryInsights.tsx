import { HomeDict } from "@/types/dictionary";
import InsightCard from "../ui/InsightCard";
import SectionHeading from "../ui/SectionHeading";

const INSIGHTS = [
  {
    id: 1,
    title: (
      <>
        The Evolution of Luxury Living in
        Dubai
      </>
    ),
    excerpt:
      "Explore how Dubai has reinvented architectural boundaries with world-renowned wonders and oasis-like amenities.",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
    link: "/article/dubai-property-market-report-2026",
    subTitle: "Design & Lifestyle"
  },
  {
    id: 2,
    title: (
      <>
        Investment Trends in UAE Property
        Market
      </>
    ),
    excerpt:
      "A comprehensive analysis of the real estate investment opportunities in Dubai and Abu Dhabi for the next decade.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop",
    link: "/article/dubai-property-market-report-2026",
    subTitle: "Market Analysis"
  },
  {
    id: 3,
    title: (
      <>
        The Art of Curating Luxury
        Collections
      </>
    ),
    excerpt:
      "Why exclusivity and provenance are key when building your very own portfolio of luxury collectibles.",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop",
    link: "/article/dubai-property-market-report-2026",
    subTitle: "Collections"
  },
];

type LuxuryInsightsProps = {
  t: HomeDict;
};

const LuxuryInsights = ({ t }: LuxuryInsightsProps) => {
  return (
    <section className="py-15">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="mb-16">
          <span className="text-slate-400 font-sans text-xs uppercase tracking-widest mb-4 block text-start">
            {t.luxuryInsights.subtitle}
          </span>
          <SectionHeading
            title={
              <>
                <span className="font-semibold">
                  {t.luxuryInsights.heading.bold}
                </span>{" "}
                <span className="font-light">
                  {t.luxuryInsights.heading.light}
                </span>
              </>
            }
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {INSIGHTS.map((post) => (
            <InsightCard
              key={post.id}
              image={post.image}
              title={post.title}
              excerpt={post.excerpt}
              link={post.link}
              subTitle={post.subTitle}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LuxuryInsights;
