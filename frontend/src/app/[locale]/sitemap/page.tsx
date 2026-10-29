import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import { SitemapDict } from "@/types/dictionary";
import Newsletter from "@/components/newsletter/Newsletter";
import SectionWrapper from "@/components/layout/SectionWrapper";
import PageHero from "@/components/layout/PageHero";

const SitemapSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-12">
    <h2 className="text-2xl font-canela text-gold mb-4 pb-4 border-b border-gray-100">
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const SitemapLink = ({
  href,
  label,
  isSubItem = false,
}: {
  href: string;
  label: string;
  isSubItem?: boolean;
}) => (
  <a
    href={href}
    className={`block text-slate-500 hover:text-gold transition-colors font-satoshi text-sm ${isSubItem ? "pl-6" : ""}`}
  >
    {label}
  </a>
);

export default async function SitemapPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "sitemap"]);

  return (
    <main className="bg-white min-h-screen">
      <Navbar
        navClassName="bg-black/20"
        scrollWrapperClassName="text-slate-900"
        scrollTextClassName="text-black"
        t={t.home}
        locale={locale as Locale}
      />
      <PageHero
        title={t.sitemap.hero.title}
        subtitle={t.sitemap.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop"
        imageAlt="Sitemap Hero"
      />

      <div className="py-20 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
          {/* Column 1: Main Offerings */}
          <div>
            <SitemapSection title={t.sitemap.sections.mainOfferings}>
              <SitemapLink href="/" label={t.sitemap.links.home} />

              <div className="mt-4">
                <SitemapLink
                  href="/listing/real-estate"
                  label={t.sitemap.links.realEstate}
                />
                <div className="mt-2 space-y-2  border-l border-gray-200">
                  <SitemapLink
                    href="/listing/villas"
                    label={t.sitemap.links.villas}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/apartments"
                    label={t.sitemap.links.apartments}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/penthouses"
                    label={t.sitemap.links.penthouses}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/off-plan"
                    label={t.sitemap.links.offPlan}
                    isSubItem
                  />
                </div>
              </div>

              <div className="mt-4">
                <SitemapLink
                  href="/listing/cars"
                  label={t.sitemap.links.cars}
                />
                <div className="mt-2 space-y-2  border-l border-gray-200">
                  <SitemapLink
                    href="/listing/cars/supercars"
                    label={t.sitemap.links.supercars}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/cars/luxury"
                    label={t.sitemap.links.luxury}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/cars/classic"
                    label={t.sitemap.links.classic}
                    isSubItem
                  />
                </div>
              </div>

              <div className="mt-4">
                <SitemapLink
                  href="/listing/yachts"
                  label={t.sitemap.links.yachts}
                />
                <div className="mt-2 space-y-2  border-l border-gray-200">
                  <SitemapLink
                    href="/listing/yachts/super-yachts"
                    label={t.sitemap.links.superYachts}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/yachts/charters"
                    label={t.sitemap.links.charters}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/yachts/builders"
                    label={t.sitemap.links.builders}
                    isSubItem
                  />
                </div>
              </div>

              <div className="mt-4">
                <SitemapLink
                  href="/listing/jets"
                  label={t.sitemap.links.jets}
                />
                <div className="mt-2 space-y-2  border-l border-gray-200">
                  <SitemapLink
                    href="/listing/jets/heavy-jets"
                    label={t.sitemap.links.heavyJets}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/jets/mid-size"
                    label={t.sitemap.links.midSize}
                    isSubItem
                  />
                  <SitemapLink
                    href="/listing/jets/services"
                    label={t.sitemap.links.services}
                    isSubItem
                  />
                </div>
              </div>
            </SitemapSection>
          </div>

          {/* Column 2: Media & Insights / Company */}
          <div>
            <SitemapSection title={t.sitemap.sections.mediaInsights}>
              <SitemapLink href="/blog" label={t.sitemap.links.blog} />
              <SitemapLink href="/search" label={t.sitemap.links.search} />
              <SitemapLink
                href="/testimonials"
                label={t.sitemap.links.testimonials}
              />
            </SitemapSection>
            <div className="h-12"></div> {/* Spacer */}
            <SitemapSection title={t.sitemap.sections.company}>
              <SitemapLink href="/about" label={t.sitemap.links.about} />
              <SitemapLink href="/contact" label={t.sitemap.links.contact} />
              <SitemapLink href="/careers" label={t.sitemap.links.careers} />
              <SitemapLink href="/press" label={t.sitemap.links.press} />
            </SitemapSection>
          </div>

          {/* Column 3: Support & Legal / User Account */}
          <div>
            <SitemapSection title={t.sitemap.sections.supportLegal}>
              <SitemapLink href="/faq" label={t.sitemap.links.faq} />
              <SitemapLink href="/support" label={t.sitemap.links.support} />
              <SitemapLink href="/privacy" label={t.sitemap.links.privacy} />
              <SitemapLink href="/terms" label={t.sitemap.links.terms} />
              <SitemapLink href="/cookies" label={t.sitemap.links.cookies} />
            </SitemapSection>
            <div className="h-12"></div> {/* Spacer */}
            <SitemapSection title={t.sitemap.sections.userAccount}>
              <SitemapLink href="/login" label={t.sitemap.links.login} />
              <SitemapLink href="/register" label={t.sitemap.links.register} />
              <SitemapLink href="/wishlist" label={t.sitemap.links.wishlist} />
            </SitemapSection>
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
