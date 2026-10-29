import { getDictionary } from "@/i18n/getDictionary";
import { Locale } from "@/i18n/config";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SelectCategoryView from "@/components/views/SelectCategoryView";

import { LocaleParams } from "@/i18n/config";

export default async function SelectCategoryPage({
    params,
}: {
    params: Promise<LocaleParams>;
}) {
    const { locale } = await params;
    const dict = await getDictionary(locale, ["selectCategory", "home"]);

    return (
        <main>
            <Navbar
                t={dict.home}
                locale={locale as any}
                wrapperClassName="bg-white shadow-lg py-4"
                textClassName="text-black"
                sellWithUsClassName="text-black"
                loginBtnClasses="text-black border-slate-200"
            />
            <SelectCategoryView dict={dict.selectCategory} />
            <Footer t={dict.home} />
        </main>
    );
}
