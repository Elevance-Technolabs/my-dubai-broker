"use client";
import { HomeDict } from "@/types/dictionary";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/images/hero/img1.jpg",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2600&auto=format&fit=crop",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2600&auto=format&fit=crop",
  },
];

type HeroProps = {
  t: HomeDict;
};

const Hero = ({ t }: HeroProps) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const currentText = t.hero.slides[activeSlide];

  return (
    <div className="relative h-screen max-h-[550px] w-full overflow-hidden bg-slate-900">
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <img
            src={slide.image}
            alt={t.hero.slides[index]?.title || "Luxury Property"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black from-0% via-black/50 via-50% to-transparent to-100%" />
        </div>
      ))}

      <div className="absolute inset-0 z-20 container mx-auto px-6 flex flex-col justify-end pb-10 md:pb-16">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
          <div
            className="w-full max-w-4xl min-h-[140px] text-end flex flex-col justify-end"
          >
            <h1 className="text-3xl font-canela text-white leading-none mb-4 drop-shadow-md animate-fade-in-up">
              {currentText?.title}
            </h1>
            <p className="text-slate-200 font-canela font-extralight italic text-md tracking-wide animate-fade-in-up delay-100">
              {currentText?.subtitle}
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col md:flex-row items-end md:items-center gap-8 md:gap-12 lg:gap-16 xl:gap-24">
            <div className="flex items-center gap-6">
              <div className="hidden md:block w-px h-16 bg-white/30"></div>

              <div
                key={activeSlide}
                className="text-right md:text-left min-w-[200px] md:w-[250px] animate-fade-in-up"
              >
                <h3 className="text-2xl font-canela text-white leading-tight">
                  {currentText?.propertyName}
                </h3>
                <p className="text-slate-300 font-satoshi italic text-xs tracking-[0.2em] uppercase mt-1">
                  {currentText?.propertyLocation}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 min-w-40">
              <div className="flex gap-3 items-center">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveSlide(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`rounded-full transition-all duration-300 ${idx === activeSlide
                      ? "w-3 h-3 bg-gold"
                      : "w-2 h-2 bg-white/50 hover:bg-white"
                      }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    prevSlide();
                    setIsAutoPlaying(false);
                  }}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    nextSlide();
                    setIsAutoPlaying(false);
                  }}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Hero;
