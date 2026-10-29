"use client";

import React, { useEffect, useState } from "react";
import { usePhoneInput, defaultCountries, parseCountry, FlagImage } from "react-international-phone";
import "react-international-phone/style.css";
import { useFormContext, useController } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import { Search, ChevronDown } from "lucide-react";
import { useRef, useMemo } from "react";

type PhoneInputProps = {
  id: string;
  label?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  isMandatory?: boolean;
  labelClassName?: string;
  register?: any;
  placeholder?: string;
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  label,
  className,
  wrapperClassName,
  disabled,
  isMandatory,
  labelClassName,
  placeholder,
}) => {
  const [defaultCountry, setDefaultCountry] = useState("ae");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInteractedRef = useRef(false);

  const { control, formState: { errors } } = useFormContext();

  const { field } = useController({
    name: id,
    control,
  });

  const fieldError = errors[id]?.message as string | undefined;

  const { phone, handlePhoneValueChange, inputRef, country: currentCountry, setCountry } = usePhoneInput({
    defaultCountry: defaultCountry,
    value: field.value,
    onChange: (p) => {
      // Avoid triggering validation on initial auto-detection if it's just the dial code
      const dialCode = `+${p.country.dialCode}`;
      const isJustDialCode = p.phone.trim() === dialCode;
      
      if (isInteractedRef.current || !isJustDialCode || p.phone === "") {
        field.onChange(p.phone);
      }
    },
  });

  useEffect(() => {
    const detectCountry = () => {
      const languages = typeof navigator !== "undefined" ? (navigator.languages || [navigator.language] || []) : [];
      for (const lang of languages) {
        if (lang.includes("-")) {
          const code = lang.split("-")[1]?.toLowerCase();
          if (code && code.length === 2) return code;
        }
      }

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzMap: Record<string, string> = {
          'Asia/Dubai': 'ae', 'Asia/Muscat': 'om', 'Asia/Riyadh': 'sa', 'Asia/Kuwait': 'kw', 'Asia/Qatar': 'qa', 'Asia/Bahrain': 'bh',
          'Asia/Kolkata': 'in', 'Asia/Calcutta': 'in', 'Europe/London': 'gb', 'Europe/Paris': 'fr', 'America/New_York': 'us'
        };
        if (tz.includes('Dubai') || tz.includes('Muscat') || tz.includes('Riyadh')) return 'ae';
        if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'in';
        if (tz.includes('London')) return 'gb';
        if (tz.includes('America')) return 'us';
        if (tzMap[tz]) return tzMap[tz];
      } catch (e) { }

      return "ae"; // Brand default
    };

    const detected = detectCountry();
    setDefaultCountry(detected);

    if (!field.value) {
      setCountry(detected);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countries = useMemo(() => {
    return defaultCountries.map((c) => parseCountry(c));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQuery = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.dialCode.includes(lowerQuery)
    );
  }, [countries, searchQuery]);

  const labelClasses = cn(
    "text-sm font-sans text-slate-900 mb-2 ml-1 transition-colors group-focus-within:text-luxury-gold",
    labelClassName
  );

  return (
    <div className={cn("flex flex-col group", wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label} {isMandatory && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <div className={cn(
          "flex items-center transition-colors border border-gray-100 rounded-none! overflow-hidden bg-white",
          className,
          fieldError ? "border-red-500! bg-red-50!" : "",
          disabled ? "bg-gray-100! cursor-not-allowed" : "focus-within:border-gold!"
        )}>
          {/* Custom Country Selector Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "px-3 flex items-center gap-1 border-r border-gray-100/50 hover:bg-gray-50 transition-colors h-full",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <FlagImage iso2={currentCountry.iso2} size={20} />
            <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", isOpen ? "rotate-180" : "")} />
          </button>

          {/* Standard Input with handlePhoneValueChange masking */}
          <input
            ref={inputRef}
            type="tel"
            value={phone}
            onFocus={() => {
              isInteractedRef.current = true;
            }}
            onChange={handlePhoneValueChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent border-none! text-sm! font-sans! focus:outline-none placeholder:text-gray-300 px-3 py-2.5 h-full",
              disabled ? "text-gray-400! cursor-not-allowed!" : ""
            )}
          />
        </div>

        {/* Custom Searchable Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-100 shadow-2xl z-50 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-gray-50 bg-gray-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-white border border-gray-200 focus:outline-none focus:border-gold rounded-md"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.iso2}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group",
                      currentCountry.iso2 === country.iso2 ? "bg-slate-50" : "hover:bg-slate-50 hover:text-gold"
                    )}
                    onClick={() => {
                      isInteractedRef.current = true;
                      setCountry(country.iso2);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <FlagImage iso2={country.iso2} size={18} />
                    <span className={cn(
                      "flex-1 text-sm font-sans transition-colors",
                      currentCountry.iso2 === country.iso2 ? "text-gold font-medium" : "text-slate-700"
                    )}>
                      {country.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      +{country.dialCode}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-gray-400 font-sans">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-red-500 mt-0.5 sm:h-1">{fieldError}</p>
    </div>
  );
};

export default PhoneInput;