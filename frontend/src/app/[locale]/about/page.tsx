import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import PageHero from "@/components/layout/PageHero";
import RedefiningSection from "@/components/about/RedefiningSection";
import ConfidenceOpportunity from "@/components/about/ConfidenceOpportunity";
import VerifiedCategories from "@/components/about/VerifiedCategories";
import MarketplaceVerification from "@/components/about/MarketplaceVerification";
import TrustTechnology from "@/components/about/TrustTechnology";
import EmpoweringSection from "@/components/about/EmpoweringSection";
import FutureCTA from "@/components/about/FutureCTA";

export default async function AboutPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "about"]);

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale as Locale} />

      <PageHero
        title={t.about.hero.title}
        subtitle={t.about.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1476304884326-cd2c88572c5f?q=80&w=1169&auto=format&fit=cropD"
        className="h-[600px]"
      />

      <RedefiningSection t={t.about} />

      <ConfidenceOpportunity t={t.about} />

      <VerifiedCategories t={t.about} />

      <MarketplaceVerification t={t.about} />

      <TrustTechnology t={t.about} />

      <EmpoweringSection t={t.about} />

      <FutureCTA t={t.about} />

      <Footer t={t.home} />
    </main>
  );
}
