import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import Newsletter from "@/components/newsletter/Newsletter";
import { BlogDict } from "@/types/dictionary";

const BlogHero = ({ t }: { t: BlogDict }) => {
  return (
    <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=2670&auto=format&fit=crop"
          alt="The View"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black from-0% via-black/40 via-40% to-transparent to-100%" />
      </div>

      {/* Content Container */}
      <div className="absolute inset-0 container mx-auto px-6 pb-20 flex flex-col justify-end items-end">
        <div className="text-right">
          <h1 className="text-5xl md:text-6xl font-canela italic text-white mb-4 drop-shadow-lg opacity-0 animate-fade-in-up">
            {t.hero.title}
          </h1>
          <p className="text-slate-200 font-sans italic font-light tracking-wide text-lg opacity-0 animate-fade-in-up delay-100">
            {t.hero.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default async function BlogPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "blog"]);

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale as Locale} />
      <BlogHero t={t.blog} />

      <div className="container mx-auto px-6 py-20">
        {/* Heading */}
        <div className="mb-14">
          <h2 className="text-4xl md:text-5xl font-canela text-slate-900">
            <span className="font-bold border-b-2 border-gold pb-2 inline-block">
              {t.blog.latestArticles.bold}
            </span>{" "}
            <span className="font-light">{t.blog.latestArticles.light}</span>
          </h2>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {t.blog.articles.map((article) => (
            <div
              key={article.id}
              className="group cursor-pointer flex flex-col h-full"
            >
              {/* Image */}
              <div className="aspect-4/3 overflow-hidden mb-6 w-full">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col items-start grow">
                <span className="text-slate-400 font-sans text-[10px] uppercase tracking-[0.15em] mb-3">
                  {article.category}
                </span>
                <h3 className="text-2xl font-canela font-bold text-slate-900 mb-3 group-hover:text-gold transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-slate-500 font-sans text-sm leading-relaxed mb-6 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-2 text-gold text-[11px] font-sans font-medium tracking-[0.05em] uppercase hover:opacity-80 transition-opacity">
                  {t.blog.readArticle}
                  <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionWrapper bg="bg-bg-light">
        {/* Pass dictionary to Newsletter. Using existing translations. */}
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}
