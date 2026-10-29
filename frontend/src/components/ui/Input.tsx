"use client";
"use no memo";

import { cn } from "@/lib/utils/cn";
import { Eye, EyeClosed } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

type InputProps = {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  register?: any;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isMandatory?: boolean;
  labelClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = ({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  register,
  className,
  wrapperClassName,
  disabled,
  leftIcon,
  rightIcon,
  isMandatory,
  labelClassName,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const context = useFormContext();
  const getNestedError = (errors: any, path: string) => {
    return path.split('.').reduce((obj, key) => obj?.[key], errors);
  };

  const errorObj = getNestedError(context?.formState?.errors, id);
  const fieldError = errorObj?.message as string | undefined;

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      onChange?.(e);
    }
  };

  const baseInputClasses =
    "w-full border border-gray-200 px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-gold transition-colors placeholder:text-gray-300";

  const noArrowClasses = `[&::-webkit-inner-spin-button]:appearance-none
    [&::-webkit-outer-spin-button]:appearance-none
    [appearance:textfield]`;

  const disabledInputClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";

  const mergedClasses = cn(
    baseInputClasses,
    noArrowClasses,
    leftIcon ? "pl-9" : "",
    fieldError ? "border-red-500 bg-red-50 focus:outline-red-600" : "",
    disabled ? disabledInputClasses : "",
    className,
  );

  const lableClasses = cn(
    "text-sm font-sans text-slate-900 mb-2 ml-1 transition-colors group-focus-within:text-luxury-gold",
    labelClassName,
  );

  return (
    <div className={cn("flex flex-col group", wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={lableClasses}>
          {label} {isMandatory && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          placeholder={placeholder}
          className={mergedClasses}
          {...(register
            ? register(id)
            : {
              value,
              onChange: type === "number" ? handleNumberInput : onChange,
            })}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          onWheel={
            type === "number" ? (e) => e.currentTarget.blur() : undefined
          }
          autoComplete="off"
          disabled={disabled}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </span>
        )}

        {type === "password" && (
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? (
              <Eye className="text-gray-500 h-5 w-5" />
            ) : (
              <EyeClosed className="text-gray-500 h-5 w-5" />
            )}
          </span>
        )}
      </div>

      <p className="text-sm text-red-500 mt-0.5 sm:h-1">{fieldError}</p>
    </div>
  );
};

export default Input;
