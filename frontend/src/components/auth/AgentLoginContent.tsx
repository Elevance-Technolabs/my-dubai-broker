"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgentLoginForm from "@/components/forms/AgentLoginForm";
import { HomeDict } from "@/types/dictionary";
import { Locale } from "@/i18n/config";

interface AgentLoginContentProps {
  t: HomeDict;
  locale: Locale;
}

// Agents don't self-register — a company owner/manager invites them
// (see /dashboard/team and /invite/[token]). This page is login only.
export default function AgentLoginContent({
  t,
  locale,
}: AgentLoginContentProps) {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      <Navbar
        t={t}
        locale={locale}
        wrapperClassName="bg-white/95 backdrop-blur-sm shadow-sm py-4"
        textClassName="text-slate-900"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-border-sec"
      />

      <main className="grow flex items-center justify-center py-24 px-6">
        <div className="w-full max-w-[440px] bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-3">
              <h2 className="text-[2rem] font-sans text-slate-900">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-500 font-sans font-light">
                Access your dashboard and manage listings.
              </p>
            </div>

            <AgentLoginForm onSuccess={handleLoginSuccess} locale={locale} />
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
