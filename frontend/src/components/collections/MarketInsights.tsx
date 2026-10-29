import SectionHeading from "../ui/SectionHeading";
import {
  CAR_MARKET_INSIGHTS,
  REAL_ESTATE_MARKET_INSIGHTS,
} from "@/data/category-data";

type MarketInsightsProps = {
  type?: string;
};

const MarketInsights = ({ type = "realEstate" }: MarketInsightsProps) => {
  const isCar = type === "cars" || type === "automotive";
  const articles = isCar ? CAR_MARKET_INSIGHTS : REAL_ESTATE_MARKET_INSIGHTS;

  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <p className="text-slate-400 font-sans text-xs uppercase tracking-widest mb-4">
            THE VIEW
          </p>
          <SectionHeading
            title={
              <>
                <span className="font-bold text-3xl">Market</span>{" "}
                <span className="font-light text-3xl">
                  insights, trends, and lifestyle.
                </span>
              </>
            }
            align="left"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="group cursor-pointer">
              {/* Image */}
              <div className="overflow-hidden mb-6 aspect-video">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-2xl font-serif text-slate-900 mb-3 group-hover:text-gold transition-colors">
                  {article.title}
                </h3>
                <p className="text-slate-500 font-sans text-sm leading-relaxed mb-4">
                  {article.excerpt}
                </p>
                <div className="text-slate-900 text-[10px] font-medium tracking-[0.2em] uppercase transition-colors group-hover:text-gold">
                  Read Article
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
