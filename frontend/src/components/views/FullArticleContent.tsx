"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Locale } from "@/i18n/config";
import { HomeDict, BlogDict, BlogArticleDict } from "@/types/dictionary";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Facebook, Twitter, Linkedin, Share2 } from "lucide-react";
import Input from "../ui/Input";
import SectionHeading from "../ui/SectionHeading";
import InsightCard from "@/components/ui/InsightCard";

interface FullArticleContentProps {
  t: {
    home: HomeDict;
    blog: BlogDict;
    blogArticle: BlogArticleDict;
  };
  locale: Locale;
}

export default function FullArticleContent({
  t,
  locale,
}: FullArticleContentProps) {
  const isAr = locale === "ar";
  const article = t.blogArticle.report2026;
  const blogArticles = t.blog.articles;

  return (
    <main className="bg-white min-h-screen">
      <Navbar
        t={t.home}
        locale={locale}
        wrapperClassName="!bg-white shadow-sm"
        textClassName="!text-slate-900"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-border-sec"
      />

      {/* Breadcrumb Section */}
      <div className="pt-32 pb-4">
        <div className="container mx-auto px-10">
          <Breadcrumb
            customTitles={{
              "the-view": isAr ? "المنظر" : "The View",
              "dubai-property-market-report-2026": article.title,
            }}
          />
        </div>
      </div>

      {/* Article Header */}
      <div className="pb-16 pt-8">
        <div className="container mx-auto px-10 max-w-4xl text-center">
          <span className="text-gold text-[10px] md:text-[11px] font-bold tracking-[0.3em] uppercase mb-6 block">
            {article.category} • <span className="text-text-sec">{article.date}</span>
          </span>
          <h1 className="text-4xl md:text-6xl font-canela text-slate-900 mb-8 leading-[1.1] font-medium">
            {article.title}
          </h1>
          <p className="text-text-sec font-sans text-lg md:text-xl leading-relaxed max-w-2xl mx-auto opacity-80">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Main Image */}
      <div className="container mx-auto px-10 mb-20 lg:mb-28">
        <div className="aspect-21/9 w-full overflow-hidden relative rounded-sm">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2670&auto=format&fit=crop"
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-10 pb-32">
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start ${isAr ? "rtl" : ""}`}
        >
          {/* Left: Article Body */}
          <div className="lg:col-span-8 space-y-12">
            <div
              className={`prose prose-slate prose-lg max-w-none font-sans p-5 text-slate-700 leading-relaxed ${isAr ? "text-right" : "text-left"}`}
            >
              <p className="md:text-lg text-slate-800 font-light mb-12 leading-relaxed">
                Dubai's real estate market continues to demonstrate remarkable resilience and growth as we enter 2026.
                Following a record-breaking year, the sector is poised for another period of sustained expansion, driven by
                strong demand from both international investors and resident buyers.
              </p>

              <h2 className="text-3xl md:text-4xl font-canela text-slate-900 mt-16 mb-8 font-medium">
                Market Overview
              </h2>
              <p className="mb-8 md:text-lg">
                The luxury segment, in particular, has outperformed expectations. Prime locations such as Palm Jumeirah,
                Emirates Hills, and Dubai Hills Estate have seen price appreciation of over 15% year-on-year. This growth is
                underpinned by a scarcity of high-end inventory and an increasing inflow of high-net-worth individuals
                relocating to the emirate.
              </p>
              <p className="mb-12 md:text-lg">
                "The demand for ultra-luxury waterfront properties remains insatiable," says Alexander Reed, Head of Luxury
                Sales at My Dubai Broker. "We are seeing a shift towards larger, more exclusive layouts that offer privacy and
                bespoke amenities."
              </p>

              <blockquote className="border-l-4 border-gold pl-6 my-20 italic text-2xl font-canela text-slate-900 bg-slate-50/80 py-2 pr-6 leading-snug">
                "Dubai is no longer just an investment destination; it is a primary
                residence for global citizens seeking safety, lifestyle, and economic
                stability."
              </blockquote>

              <h2 className="text-3xl font-canela text-slate-900 mt-16 mb-8 font-medium">
                Emerging Hotspots
              </h2>
              <p className="mb-8">
                While traditional luxury hubs remain popular, new areas are gaining traction. The expansion of the Dubai
                Creek Harbour and the continued development of Dubai South are creating new opportunities for capital
                appreciation. Investors are also keeping a close eye on the Jumeirah Golf Estates extension, which promises
                to deliver world-class living standards.
              </p>
              <ul className="list-none space-y-6 my-10">
                <li className="flex items-start gap-4">
                  <span className="w-1.5 h-1.5 bg-dark mt-2 shrink-0 rounded-full"></span>
                  <div>
                    <strong className="text-slate-900 block mb-1">
                      Palm Jebel Ali:
                    </strong>
                    Revived interest in this mega-project suggests significant long-term potential.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-1.5 h-1.5 bg-dark mt-2 shrink-0 rounded-full"></span>
                  <div>
                    <strong className="text-slate-900 block mb-1">
                      Ras Al Khor:
                    </strong>
                    With the wildlife sanctuary nearby, this area offers a unique blend of nature and urban
                    living.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-1.5 h-1.5 bg-dark mt-2 shrink-0 rounded-full"></span>
                  <div>
                    <strong className="text-slate-900 block mb-1">
                      DIFC Living:
                    </strong>
                    New residential concepts within the financial center are attracting young professionals.
                  </div>
                </li>
              </ul>

              <h2 className="text-3xl font-canela text-slate-900 mt-16 mb-8 font-medium">
                Outlook for Q3 & Q4
              </h2>
              <p className="mb-8">
                Looking toward the second half of 2026, we anticipate a
                Looking ahead, analysts predict a stabilization of rental yields and a moderate increase in sales prices. The
                government's continued initiatives to attract foreign talent, including new visa regulations, will provide a solid
                foundation for sustained demand.
              </p>
              <p>
                For investors, the key lies in identifying premium assets with unique selling points—be it location,
                architectural significance, or brand association. As the market matures, quality will be the ultimate
                differentiator.
              </p>
            </div>

            {/* Share Buttons */}
            <div
              className={`flex items-center gap-2 pt-16 border-t border-slate-100 mt-20 ${isAr ? "flex-row-reverse" : ""}`}
            >
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                SHARE THIS ARTICLE :
              </span>
              <div className="flex items-center gap-2 font-bold">
                <button className="w-11 h-11 rounded-full flex items-center justify-center">
                  <Facebook className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full flex items-center justify-center">
                  <Twitter className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full flex items-center justify-center">
                  <Linkedin className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-4 space-y-16 lg:sticky lg:top-32">
            {/* Author Card */}
            <div
              className={`bg-white p-10 border border-slate-100  ${isAr ? "text-right" : ""}`}
            >
              <h4 className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                {article.sidebar.authorTitle}
              </h4>
              <div
                className={`flex items-center gap-5 ${isAr ? "flex-row-reverse" : ""}`}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-slate-50">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h5 className="font-sans font-bold text-slate-900 text-xl leading-tight">
                    {article.author.name}
                  </h5>
                  <p className="text-slate-400 text-[10px] font-bold tracking-[0.15em] uppercase">
                    {article.author.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            <div className={isAr ? "text-right" : "text-left"}>
              <h4 className="text-slate-900 text-2xl font-serif font-bold mb-10 border-b border-gold pb-4 inline-block">
                {article.sidebar.relatedTitle}
              </h4>
              <div className="space-y-10">
                {blogArticles.slice(1, 4).map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/the-view/article-${rel.id}`}
                    className="group block"
                  >
                    <span className="text-gold text-[10px] font-bold uppercase tracking-widest block mb-3">
                      {rel.category}
                    </span>
                    <h5 className="text-slate-900 font-sans text-lg leading-snug group-hover:text-gold transition-all duration-300 line-clamp-2">
                      {rel.title}
                    </h5>
                    <span className="text-slate-400 text-[10px] font-sans mt-3 block">
                      JAN 22, 2026
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Card */}
            <div className="bg-slate-900 p-12 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-bg-light" />
              <div className="relative z-10">
                <h4 className="font-canela text-3xl mb-4 italic font-medium">
                  {article.sidebar.newsletter.title}
                </h4>
                <p className="text-sm font-sans leading-relaxed mb-10 opacity-80">
                  {article.sidebar.newsletter.description}
                </p>
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder={article.sidebar.newsletter.placeholder}
                    id="email"
                    label=""
                    className="border border-slate-400 placeholder:text-slate-400"
                  />
                  <Button
                    variant="gold"
                    className="w-full bg-black border-black"
                  >
                    {article.sidebar.newsletter.button}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More from The View */}
      <SectionWrapper bg="bg-white">
        <div className="container mx-auto px-10 py-10">
          <div className={`mb-20 ${isAr ? "text-right" : ""}`}>
            <SectionHeading
              title={
                <>
                  <span className="font-semibold text-3xl">{article.moreFromTitle.bold}</span>{" "}
                  <span className="font-light text-3xl">{article.moreFromTitle.light}</span>
                </>
              }
              align="left"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {blogArticles.slice(1, 4).map((article, idx) => (
              <InsightCard
                key={article.id}
                image={article.image}
                title={article.title}
                excerpt={article.excerpt}
                link={`/${locale}/article/dubai-property-market-report-2026`}
                subTitle={article.category}
                readMoreText={isAr ? "اقرأ المقال" : "Read Article"}
              />
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper bg="bg-bg-light">
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}
