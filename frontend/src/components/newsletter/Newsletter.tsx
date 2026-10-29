"use client";

import Button from "../ui/Button";
import { HomeDict } from "@/types/dictionary";

type NewsletterProps = {
  t: HomeDict;
};

const Newsletter = ({ t }: NewsletterProps) => {
  return (
    <section className="py-15">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div className="md:w-1/2">
            <h2 className="text-3xl font-serif text-slate-900 leading-tight mb-6">
              <span className="font-semibold border-b-2 border-gold sm:pb-2 p-0">{t.newsletter.heading.bold}</span>{" "}
              <span className="font-light">{t.newsletter.heading.light}</span>
            </h2>
            <p className="text-slate-500 font-sans text-sm max-w-md mb-8">
              {t.newsletter.description}
            </p>
          </div>

          {/* Form */}
          <div className="w-full md:w-1/2 max-w-lg pt-2">
            <form
              className="flex flex-col sm:flex-row gap-0"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={t.newsletter.form.placeholder}
                className="flex-1 bg-white text-slate-900 placeholder-slate-400 px-6 py-3 focus:outline-none font-sans"
              />
              <Button variant="dark">{t.newsletter.form.button}</Button>
            </form>
            <p className="text-slate-400 text-[10px] mt-4 font-sans">
              {t.newsletter.form.disclaimer.split("Privacy Policy").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a href="/privacy" className="text-gold hover:underline">
                      Privacy Policy
                    </a>
                  )}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
