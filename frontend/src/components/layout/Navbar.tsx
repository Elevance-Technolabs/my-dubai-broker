"use client";
import { X, Menu, ArrowRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { HomeDict } from "@/types/dictionary";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { FrontendAuthService } from "@/services/auth.service";

type NavbarProps = {
  t: HomeDict;
  wrapperClassName?: string;
  textClassName?: string;
  sellWithUsClassName?: string;
  loginBtnClasses?: string;
  locale: Locale;
  scrollWrapperClassName?: string;
  scrollTextClassName?: string;
  navClassName?: string;
};

const Navbar = ({
  t,
  wrapperClassName,
  textClassName,
  sellWithUsClassName,
  locale,
  scrollWrapperClassName,
  scrollTextClassName,
  navClassName,
  loginBtnClasses
}: NavbarProps) => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeMobileAccordion, setActiveMobileAccordion] = useState<string | null>(null);

  const isRtl = locale === 'ar';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [mobileMenuOpen]);

  const navClasses = scrolled || hoveredItem || mobileMenuOpen
    ? cn("bg-white py-4 shadow-md", scrollWrapperClassName)
    : cn("bg-transparent py-6", navClassName);

  const textClasses = scrolled || hoveredItem || mobileMenuOpen
    ? cn("text-slate-900", scrollTextClassName, textClassName)
    : cn("text-white", textClassName);

  const menuItems = [
    { key: "realEstate", label: t.navbar.menu.realEstate, hasMega: true },
    { key: "cars", label: t.navbar.menu.cars, hasMega: true },
    { key: "yachts", label: t.navbar.menu.yachts, hasMega: true },
    { key: "jets", label: t.navbar.menu.jets, hasMega: true },
    { key: "collectibles", label: t.navbar.menu.collectibles, hasMega: true },
    { key: "rentals", label: t.navbar.menu.rentals, hasMega: false },
    { key: "theView", label: t.navbar.menu.theView, hasMega: false },
  ];

  const megaMenuContent = hoveredItem ? (t.navbar.megaMenu as any)[hoveredItem] : null;

  return (
    <nav
      className={cn("fixed px-3 w-full z-50 transition-all duration-300", navClasses, wrapperClassName)}
      onMouseLeave={() => setHoveredItem(null)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-11 space-x-8 xl:space-x-16 rtl:space-x-reverse">
          <Link href={`/${locale}`} className={cn("font-canela font-bold tracking-widest leading-none text-xs md:text-sm", textClasses)}>
            <div className="block">MY</div>
            <div className="block">DUBAI</div>
            <div className="block">BROKER.</div>
          </Link>

          {/* Desktop Menu */}
          <div className={cn("hidden font-satoshi xl:flex items-center space-x-6 xl:space-x-10 text-sm font-semibold tracking-wide rtl:space-x-reverse", textClasses)}>
            {menuItems.map((item) => (
              <div key={item.key} className="relative py-4" onMouseEnter={() => setHoveredItem(item.key)}>
                <Link
                  href={item.key === "theView" ? `/${locale}/the-view` : `/${locale}/category/${item.key}`}
                  className={cn("transition-colors hover:text-gold tracking-wider font-medium uppercase text-[11px]", hoveredItem === item.key ? "text-gold" : "")}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className={cn("hidden xl:flex items-center space-x-6 rtl:space-x-reverse", textClasses)}>
          <Link href={`/${locale}/onboarding`}>
            <Button variant="ghost" className={cn("h-10 px-6 text-[10px] font-bold tracking-[0.2em] uppercase", (scrolled || hoveredItem) ? "text-black/90" : "text-white", sellWithUsClassName)}>
              {t.navbar.cta.sellWithUs}
            </Button>
          </Link>
          {false ? (
            <Button
              variant="outline"
              className={cn("h-9 px-8 text-[10px] rounded-full font-bold tracking-[0.2em] uppercase border", (scrolled || hoveredItem) ? "text-black border-slate-200" : "text-white border-white/30", loginBtnClasses)}
              onClick={async () => {
                const response = await FrontendAuthService.signOut();
                if (response.success) {
                  router.push(`/${locale}/login`);
                }
              }}
            >
              LOGOUT
            </Button>
          ) : (
            <Link href={`/${locale}/login`}>
              <Button variant="outline" className={cn("h-9 px-8 text-[10px] rounded-full font-bold tracking-[0.2em] uppercase border", (scrolled || hoveredItem) ? "text-black border-slate-200" : "text-white border-white/30", loginBtnClasses)}>
                {t.navbar.cta.login}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className={cn("xl:hidden p-2", textClasses)} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- DESKTOP MEGA MENU --- */}
      {megaMenuContent && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-2xl py-14 animate-in fade-in slide-in-from-top-2 duration-300 z-10 hidden xl:block">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-6 grid grid-cols-3 gap-8">
                {megaMenuContent.columns.map((col: any, idx: number) => (
                  <div key={idx}>
                    <h4 className="font-satoshi text-[10px] uppercase tracking-[0.2em] text-slate-900 font-bold mb-6 border-b border-gold/30 pb-2 inline-block">
                      {col.title}
                    </h4>
                    <ul className="space-y-4">
                      {col.items.map((link: string) => (
                        <li key={link}>
                          <Link
                            href={`/${locale}/category/${hoveredItem}`}
                            className="text-slate-500 hover:text-gold text-[13px] transition-colors font-medium block"
                            onClick={() => setHoveredItem(null)}
                          >
                            {link}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="col-span-3 px-4">
                <div className="relative aspect-4/3 overflow-hidden rounded-sm shadow-sm">
                  <img src={megaMenuContent.featured.image} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="col-span-3 flex flex-col justify-center pl-6 rtl:pl-0 rtl:pr-6">
                {megaMenuContent.featured.title && <h3 className="font-canela text-2xl text-slate-900 mb-1 leading-tight">{megaMenuContent.featured.title}</h3>}
                {megaMenuContent.featured.subtitle && <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-4 font-satoshi">{megaMenuContent.featured.subtitle}</p>}
                {megaMenuContent.featured.linkText && (
                  <Link
                    href={`/${locale}/category/${hoveredItem}`}
                    className="flex items-center gap-2 text-gold text-[10px] font-bold tracking-[0.15em] mb-6 group"
                    onClick={() => setHoveredItem(null)}
                  >
                    {megaMenuContent.featured.linkText} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                  </Link>
                )}
                <p className={cn("text-slate-600 italic font-canela text-sm leading-relaxed border-slate-100 px-4", isRtl ? "border-r" : "border-l")}>
                  {megaMenuContent.featured.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE OVERLAY MENU --- */}
      <div className={cn(
        "fixed inset-0 md:top-[92px] top-[80px] bg-white z-40 xl:hidden transition-transform duration-500 ease-in-out px-6 py-8 overflow-y-auto border-t border-slate-100",
        mobileMenuOpen ? "translate-x-0" : (isRtl ? "translate-x-full" : "-translate-x-full")
      )}>
        <div className="flex flex-col space-y-4">
          {menuItems.map((item) => (
            <div key={item.key} className="border-b border-slate-50 pb-2">
              <Link
                href={item.key === "theView" ? `/${locale}/the-view` : `/${locale}/category/${item.key}`}
                className="text-slate-900 font-canela text-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>

              {/* Mobile Accordion Content */}
              {item.hasMega && activeMobileAccordion === item.key && (
                <div className="pb-6 pt-2 grid grid-cols-2 gap-x-4 gap-y-8 animate-in fade-in slide-in-from-top-2">
                  {(t.navbar.megaMenu as any)[item.key].columns.map((col: any, idx: number) => (
                    <div key={idx}>
                      <h5 className="text-[10px] uppercase tracking-widest text-gold font-bold mb-4">{col.title}</h5>
                      <ul className="space-y-3">
                        {col.items.map((sub: string) => (
                          <li key={sub}>
                            <Link
                              href={`/${locale}/category/${item.key}`}
                              className="text-slate-500 text-sm block"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {sub}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile CTAs */}
        <div className="mt-12 space-y-4">
          <Link href={`/${locale}/onboarding`} className="block" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-slate-900 text-white rounded-none py-6 uppercase tracking-widest text-xs">
              {t.navbar.cta.sellWithUs}
            </Button>
          </Link>
          {false ? (
            <Button
              variant="outline"
              className="w-full border-slate-200 rounded-none py-6 uppercase tracking-widest text-xs text-slate-900"
              onClick={async () => {
                setMobileMenuOpen(false);
                const response = await FrontendAuthService.signOut();
                if (response.success) {
                  router.push(`/${locale}/login`);
                }
              }}
            >
              LOGOUT
            </Button>
          ) : (
            <Link href={`/${locale}/login`} className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full border-slate-200 rounded-none py-6 uppercase tracking-widest text-xs text-slate-900">
                {t.navbar.cta.login}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;