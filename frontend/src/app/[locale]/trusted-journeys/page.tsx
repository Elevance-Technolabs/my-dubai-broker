import { getDictionary } from "@/i18n/getDictionary";
import TrustedJourneysView from "@/components/views/TrustedJourneysView";
import { LocaleParams } from "@/i18n/config";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function TrustedJourneysPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const dict = await getDictionary(locale, ["trustedJourneys", "home"]);

    return (
        <>
            <Navbar t={dict.home} locale={locale as any}
                wrapperClassName="bg-white shadow-lg py-4" textClassName="text-black"
                sellWithUsClassName="text-black"
                loginBtnClasses="text-black border-slate-200"
            />
            <main>
                <TrustedJourneysView dict={dict.trustedJourneys} />
            </main>
            <Footer t={dict.home} />
        </>
    );
}
