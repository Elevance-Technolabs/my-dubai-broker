import { getDictionary } from "@/i18n/getDictionary";
import { LocaleParams } from "@/i18n/config";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OnboardingWizard from "@/components/views/OnboardingWizard";

export default async function OnboardingPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const dict = await getDictionary(locale, ["onboarding", "home"]);

    return (
        <main className="bg-white">
            <Navbar
                t={dict.home}
                locale={locale as any}
                wrapperClassName="bg-white shadow-sm py-4"
                textClassName="text-black"
                sellWithUsClassName="text-black"
                loginBtnClasses="text-black border-slate-200"
            />
            {/* Simple Progress Header for higher premium feel */}
            <div className="bg-slate-50 border-b border-slate-100 py-6">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-canela text-slate-900">{dict.onboarding.title}</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold mt-1">Setup your professional presence</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Support</p>
                        <p className="text-xs font-medium text-slate-900">+971 4 123 4567</p>
                    </div>
                </div>
            </div>
            <OnboardingWizard dict={dict.onboarding} />
            <Footer t={dict.home} />
        </main>
    );
}
