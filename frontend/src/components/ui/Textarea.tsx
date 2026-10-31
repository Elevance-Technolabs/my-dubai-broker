"use client";
import { cn } from "@/lib/utils/cn";
import type React from "react";
import { useFormContext } from "react-hook-form";

type TextareaProps = {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  register?: any;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  isMandatory?: boolean;
  rows?: number;
  labelClassName?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea: React.FC<TextareaProps> = ({
  id,
  label,
  placeholder = "",
  value,
  onChange,
  register,
  className,
  wrapperClassName,
  disabled,
  isMandatory,
  rows = 4,
  labelClassName,
  ...props
}) => {
  const context = useFormContext();
  const errorObj = id
    .split(".")
    .reduce<any>((obj, key) => obj?.[key], context?.formState?.errors);
  const fieldError = errorObj?.message as string | undefined;

  const baseTextareaClasses =
    "w-full border border-gray-200 px-4 py-3 text-sm font-sans focus:outline-none focus:border-gold transition-colors placeholder:text-gray-300 resize-none";

  const disabledTextareaClasses =
    "bg-gray-100 text-gray-400 cursor-not-allowed";

  const mergedClasses = cn(
    baseTextareaClasses,
    fieldError ? "border-red-500 bg-red-50 focus:outline-red-600" : "",
    disabled ? disabledTextareaClasses : "",
    className,
  );

  const labelClasses = cn(
    "text-sm font-sans text-slate-900 mb-2 ml-1 transition-colors group-focus-within:text-luxury-gold",
    labelClassName,
  );

  return (
    <div className={cn("flex flex-col group", wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label} {isMandatory && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          id={id}
          placeholder={placeholder}
          className={mergedClasses}
          rows={rows}
          {...(register
            ? register(id)
            : {
              value,
              onChange,
            })}
          disabled={disabled}
          {...props}
        />
      </div>

      <p className="text-sm text-red-500 mt-0.5 sm:min-h-5">{fieldError}</p>
    </div>
  );
};

export default Textarea;
