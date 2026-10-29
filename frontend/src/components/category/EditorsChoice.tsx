import React from "react";
import SectionHeading from "../ui/SectionHeading";
import { ArrowRight, Play } from "lucide-react";
import { EDITOR_CHOICE_DATA } from "@/data/category-data";
import Button from "../ui/Button";

type EditorChoiceItem = {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    badge?: string;
    hasVideo?: boolean;
    isLarge?: boolean;
};

type EditorsChoiceProps = {
    category: keyof typeof EDITOR_CHOICE_DATA;
};

const EditorsChoice = ({ category }: EditorsChoiceProps) => {
    const data = EDITOR_CHOICE_DATA[category];

    if (!data) return null;

    const items = data.items as EditorChoiceItem[];
    const largeItem = items.find((item) => item.isLarge);
    const smallItems = items.filter((item) => !item.isLarge);

    return (
        <section className="py-12">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-bold text-3xl font-serif">{data.titleBold}</span>{" "}
                                <span className="font-light text-3xl font-serif">{data.titleLight}</span>
                            </>
                        }
                        align="left"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
                    {/* Main Featured Item (Left) */}
                    {largeItem && (
                        <div className="relative group overflow-hidden cursor-pointer h-[400px] lg:h-full rounded-md lg:col-span-2">
                            <img
                                src={largeItem.image}
                                alt={largeItem.title}
                                className="absolute inset-0 w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                            {largeItem.hasVideo && (
                                <div className="absolute top-6 right-6">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                        <Play size={20} fill="currentColor" />
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-sans text-white mb-2">
                                        {largeItem.title}
                                    </h3>
                                    <p className="text-gray-50/70 font-sans text-sm mb-6 font-light">
                                        {largeItem.subtitle}
                                    </p>
                                </div>
                                <Button className="flex items-center gap-2 rounded-full px-2 py-1 tracking-wide text-nowrap capitalize text-xs h-8 text-light border-border-light" variant="outlineWhite" endIcon={<ArrowRight size={12} className="w-3 h-3" />}>
                                    Price on Request
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Secondary Items (Right) */}
                    <div className="flex flex-col gap-6 h-auto lg:h-full">
                        {smallItems.map((item) => (
                            <div key={item.id} className="relative group overflow-hidden cursor-pointer h-[250px] lg:h-1/2 rounded-md">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                                {item.hasVideo && (
                                    <div className="absolute top-6 right-6">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                            <Play size={16} fill="currentColor" />
                                        </div>
                                    </div>
                                )}

                                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-xl font-sans text-white mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-50/70 font-sans text-xs font-light">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                    <Button className="flex items-center gap-2 rounded-full text-nowrap tracking-tight px-2 py-1 capitalize text-xs h-8 text-light border-border-light" variant="outlineWhite" endIcon={<ArrowRight size={12} className="w-3 h-3" />}>
                                        Price on Request
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EditorsChoice;
