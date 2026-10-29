import { HomeDict } from "@/types/dictionary";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

type FooterProps = {
  t: HomeDict;
};

const Footer = ({ t }: FooterProps) => {
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer className="bg-black text-white pt-20 pb-10 px-6 border-t border-white/10">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-20">
          <div className="col-span-1 lg:col-span-2">
            <div className="mb-8">
              <img
                src="/images/logo/light-logo.svg"
                className="w-32"
                alt="My Dubai Broker"
              />
            </div>
            <p className="text-zinc-500 font-sans text-sm leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          <div>
            <h5 className="font-sans text-xs font-bold tracking-[0.2em] mb-8 text-white uppercase">
              {t.footer.sections.about.title}
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-sans">
              {t.footer.sections.about.links.map(([name, link], index) => (
                <li key={index}>
                  <a href={link} className="hover:text-white transition-colors">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-sans text-xs font-bold tracking-[0.2em] mb-8 text-white uppercase">
              {t.footer.sections.sellers.title}
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-sans">
              {t.footer.sections.sellers.links.map(([name, link], index) => (
                <li key={index}>
                  <a href={link} className="hover:text-white transition-colors">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-sans text-xs font-bold tracking-[0.2em] mb-8 text-white uppercase">
              {t.footer.sections.legal.title}
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-sans">
              {t.footer.sections.legal.links.map(([name, link], index) => (
                <li key={index}>
                  <a href={link} className="hover:text-white transition-colors">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-sans text-xs font-bold tracking-[0.2em] mb-8 text-white uppercase">
              {t.footer.sections.support.title}
            </h5>
            <ul className="space-y-4 text-zinc-400 text-sm font-sans">
              {t.footer.sections.support.links.map(([name, link], index) => (
                <li key={index}>
                  <a href={link} className="hover:text-white transition-colors">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-zinc-600 font-sans order-2 md:order-1">
            {t.footer.copyright.replace("{{year}}", currentYear)}
          </p>

          <div className="flex gap-4 order-1 md:order-2">
            <a
              href="#"
              className="flex items-center justify-center size-9 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              className="flex items-center justify-center size-9 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="#"
              className="flex items-center justify-center size-9 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href="#"
              className="flex items-center justify-center size-9 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <Twitter className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
