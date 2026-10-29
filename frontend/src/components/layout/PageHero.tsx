import { cn } from "@/lib/utils/cn";
import SearchInput from "../ui/SearchInput";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  imageAlt?: string;
  className?: string;
  searchPlaceholder?: string;
  titleClasses?: string;
}

const PageHero = ({
  title,
  subtitle,
  backgroundImage,
  imageAlt = "Page Hero Image",
  className,
  searchPlaceholder,
  titleClasses,
}: PageHeroProps) => {
  return (
    <div
      className={cn(
        "relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-slate-900",
        className,
      )}
    >
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="absolute inset-0 z-20 container mx-auto px-6 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-4xl animate-fade-in-up">
          <h1 className={cn("text-3xl md:text-4xl font-canela italic text-white mb-10 tracking-wide drop-shadow-xl", titleClasses)}>
            {title}
          </h1>

          {searchPlaceholder && (
            <SearchInput placeholder={searchPlaceholder} />
          )}

          {subtitle && (
            <p className="text-white/70 mt-3 italic font-canela text-sm md:text-base tracking-widest drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHero;
