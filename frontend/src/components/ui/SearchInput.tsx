"use client";

import { useState, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import Input from "../ui/Input";

const SearchInput = ({ placeholder }: { placeholder: string }) => {
    const [searchValue, setSearchValue] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const mockResults = ["Dubai Marina", "Downtown Dubai", "Jumeirah Bay Island"];

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev < mockResults.length - 1 ? prev + 1 : prev
            );
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        else if (e.key === "Enter") {
            if (activeIndex >= 0 && activeIndex < mockResults.length) {
                setSearchValue(mockResults[activeIndex]);
                setActiveIndex(-1);
            }
        }
        else if (e.key === "Escape") {
            setActiveIndex(-1);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto overflow-hidden bg-white rounded-xl shadow-2xl">
            <Input
                id="hero-search"
                type="text"
                placeholder={placeholder}
                className="border-0 text-slate-800 rounded-xl focus:ring-0 focus:border-0 h-12 pt-4"
                rightIcon={<Search className="text-gold w-5 h-5 font-bold mt-1" />}
                wrapperClassName="w-full"
                value={searchValue}
                onChange={(e) => {
                    setSearchValue(e.target.value);
                    setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
            />

            {searchValue.length > 0 && (
                <div className="flex flex-col border-t bg-white border-gray-200 max-h-[180px] overflow-y-auto">
                    {mockResults.map((result, idx) => (
                        <button
                            key={idx}
                            className={`w-full text-left px-8 py-4 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-sm border-b border-gray-50 last:border-b-0 ${activeIndex === idx ? "bg-slate-100" : ""
                                }`}
                            onClick={() => {
                                setSearchValue(result);
                                setActiveIndex(-1);
                            }}
                        >
                            {result}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchInput;