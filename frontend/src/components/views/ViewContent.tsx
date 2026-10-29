"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import { Locale } from "@/i18n/config";
import { HomeDict, BlogDict } from "@/types/dictionary";
import Link from "next/link";

interface ViewContentProps {
  t: {
    home: HomeDict;
    blog: BlogDict;
  };
  locale: Locale;
}

export default function ViewContent({ t, locale }: ViewContentProps) {
  const isAr = locale === "ar";
  const articles = t.blog.articles;

  // Split articles for the magazine layout: Left (2), Featured (1), Right (2)
  const leftArticles = articles.slice(0, 2);
  const featuredArticle = articles[2];
  const rightArticles = articles.slice(3, 5);

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale} wrapperClassName="transparent" />

      <PageHero
        title={t.blog.hero.title}
        subtitle={t.blog.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=2670&auto=format&fit=crop"
        imageAlt="The View"
      />

      <div className="container mx-auto px-6 max-w-[1440px] py-24 md:py-32">
        {/* Heading */}
        <div className={`mb-20 md:mb-24 ${isAr ? "text-right" : ""}`}>
          <h2 className="text-4xl font-canela text-slate-900 tracking-tight text-center md:text-left">
            <span className="font-bold border-b-2 border-gold pb-2 inline-block leading-tight">
              {t.blog.latestArticles.bold}
            </span>{" "}
            <span className="font-light">{t.blog.latestArticles.light}</span>
          </h2>
        </div>

        {/* Magazine Grid - 3:6:3 for a strong magazine focal point */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-8">
          {/* Left Column */}
          <div className="md:col-span-3 flex flex-col gap-16 lg:gap-24">
            {leftArticles.map((article, idx) => (
              <ArticleSmall key={article.id} article={article} locale={locale} idx={idx} />
            ))}
          </div>

          {/* Featured Center Article */}
          {featuredArticle && (
            <div className="md:col-span-6 h-full">
              <ArticleFeatured
                article={featuredArticle}
                locale={locale}
                idx={2}
              />
            </div>
          )}

          {/* Right Column */}
          <div className="md:col-span-3 flex flex-col gap-16 lg:gap-24">
            {rightArticles.map((article, idx) => (
              <ArticleSmall key={article.id} article={article} locale={locale} idx={idx + 3} />
            ))}
          </div>
        </div>
      </div>

      <SectionWrapper bg="bg-bg-light">
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}

interface ArticleProps {
  article: any;
  locale: string;
  idx: number;
}

function ArticleSmall({ article, locale, idx }: ArticleProps) {
  const isAr = locale === "ar";
  return (
    <Link
      href={
        article.id === 1
          ? `/${locale}/the-view/dubai-property-market-report-2026`
          : `/${locale}/the-view`
      }
      className="group cursor-pointer flex flex-col h-full animate-in fade-in slide-in-from-bottom-12 duration-1000"
      style={{ animationDelay: `${idx * 150}ms` }}
    >
      <div className="aspect-3/2 overflow-hidden mb-6 w-full bg-slate-100 relative shadow-md">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 border border-slate-900/5 group-hover:border-gold/20 transition-colors duration-500" />
      </div>

      <div className={`flex flex-col items-start ${isAr ? "text-right items-end" : "text-left"}`}>
        <span className="text-slate-400 font-sans text-[11px] font-bold uppercase tracking-[0.25em] mb-4">
          {article.category}
        </span>
        <h3 className="text-2xl font-canela text-slate-900 group-hover:text-gold transition-colors duration-500 leading-tight font-light tracking-tight">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

function ArticleFeatured({ article, locale, idx }: ArticleProps) {
  const isAr = locale === "ar";
  return (
    <Link
      href={`/${locale}/the-view`}
      className="group cursor-pointer relative flex flex-col h-full w-full overflow-hidden animate-in fade-in zoom-in-95 duration-1000 aspect-[0.7] md:aspect-[0.75] shadow-xl"
      style={{ animationDelay: `${idx * 150}ms` }}
    >
      <div className="absolute inset-0 bg-slate-100">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
      </div>

      <div className="mt-auto relative p-10 md:p-16 text-center flex flex-col items-center">
        <span className="text-white/90 font-sans text-[12px] font-bold uppercase tracking-[0.4em] mb-6 inline-block">
          {article.category}
        </span>
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-canela text-white group-hover:text-gold transition-colors duration-500 leading-[1.05] mb-6 font-light max-w-2xl mx-auto shadow-sm">
          {article.title}
        </h3>
        <p className="hidden lg:block text-white/80 font-sans text-lg leading-relaxed line-clamp-2 font-light max-w-xl mx-auto opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}

