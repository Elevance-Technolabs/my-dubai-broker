import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getDictionary } from "@/i18n/getDictionary";
import { Locale, LocaleParams } from "@/i18n/config";
import ContactForm from "@/components/forms/ContactForm";
import ContactHeader from "@/components/contact/ContactHeader";
import ContactDetails from "@/components/contact/ContactDetails";

export default async function ContactPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale, ["home", "contact"]);

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale as Locale} wrapperClassName="bg-white shadow-lg py-4" textClassName="text-black"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-slate-200" />

      <ContactHeader dict={t.contact} />

      <ContactForm dict={t.contact} />

      <ContactDetails dict={t.contact} />

      <Footer t={t.home} />
    </main>
  );
}
