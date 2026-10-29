"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";

export type SelectOption = {
  label: string;
  value: string | number;
};

type SelectProps = {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  register?: any;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  isMandatory?: boolean;
  labelClassName?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  placeholder = "Select an option",
  value,
  onChange,
  register,
  className,
  wrapperClassName,
  disabled,
  isMandatory,
  labelClassName,
  ...props
}) => {
  const form = useFormContext();
  const fieldError = form?.formState?.errors?.[id]?.message as
    | string
    | undefined;

  const baseSelectClasses =
    "w-full border border-gray-200 px-4 py-3 text-sm font-sans focus:outline-none focus:border-gold transition-colors appearance-none bg-white placeholder:text-gray-300";

  const disabledSelectClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";

  const mergedClasses = cn(
    baseSelectClasses,
    fieldError ? "border-red-500 bg-red-50 focus:outline-red-600" : "",
    disabled ? disabledSelectClasses : "",
    className,
  );

  const lableClasses = cn(
    "text-sm font-sans text-slate-900 mb-2 ml-1 transition-colors group-focus-within:text-luxury-gold",
    labelClassName,
  );

  return (
    <div className={cn("flex flex-col", wrapperClassName)}>
      <label htmlFor={id} className={lableClasses}>
        {label} {isMandatory && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          id={id}
          className={mergedClasses}
          {...(register
            ? register(id)
            : {
                value: value ?? "",
                onChange,
              })}
          disabled={disabled}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      <p className="text-sm text-red-500 mt-0.5 sm:h-1">{fieldError}</p>
    </div>
  );
};

export default Select;
