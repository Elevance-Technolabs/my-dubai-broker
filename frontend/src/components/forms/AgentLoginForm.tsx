"use client";
"use no memo";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  LoginFormData,
  defaultLoginValues,
} from "@/lib/schemas/loginSchema";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { summarizeFieldErrors } from "@/lib/utils/formErrors";
import { FrontendAuthService } from "@/services/auth.service";
import type { Locale } from "@/i18n/config";

interface AgentLoginFormProps {
  onSuccess?: (data: LoginFormData) => void;
  locale?: Locale;
}

export default function AgentLoginForm({ onSuccess, locale }: AgentLoginFormProps) {
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: defaultLoginValues,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const { register, handleSubmit } = methods;

  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);

  const onInvalid = (errors: Parameters<typeof summarizeFieldErrors>[0]) => {
    toast.error(summarizeFieldErrors(errors));
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await FrontendAuthService.login({
        email: data.email,
        password: data.password,
        rememberMe,
      });

      if (response.success) {
        toast.success("Signed in successfully!");
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        toast.error(
          response.error || "Failed to sign in. Please check your credentials.",
        );
      }
    } catch {
      toast.error("Could not reach the server. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Input
          id="email"
          isMandatory
          label="Email Address"
          type="email"
          placeholder="name@agency.com"
          register={register}
          labelClassName="text-slate-900 font-medium text-sm mb-1.5"
        />

        <Input
          id="password"
          isMandatory
          label="Password"
          type="password"
          placeholder="Enter your password"
          register={register}
          labelClassName="text-slate-900 font-medium text-sm mb-1.5"
        />

        <div className="flex items-center justify-between mt-2!">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded cursor-pointer transition-colors"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-slate-500 cursor-pointer font-sans"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              href={locale ? `/${locale}/forgot-password` : "/forgot-password"}
              className="font-medium text-gold/80 hover:text-gold transition-colors font-sans"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="dark"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
