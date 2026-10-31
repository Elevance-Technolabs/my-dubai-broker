"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import {
  resetPasswordSchema,
  type ResetPasswordData,
} from "@/lib/schemas/accountSchemas";
import { summarizeFieldErrors } from "@/lib/utils/formErrors";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { FrontendAuthService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const methods = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) {
      toast.error("This reset link is invalid or has expired.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await FrontendAuthService.resetPassword(
        data.password,
        token,
      );
      if (response.success) {
        toast.success("Password reset. Please sign in.");
        router.push(`/${locale}/login`);
      } else {
        toast.error(response.error || "Failed to reset password");
      }
    } catch {
      toast.error("Could not reach the server. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: Parameters<typeof summarizeFieldErrors>[0]) => {
    toast.error(summarizeFieldErrors(errors));
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white text-center">
        <div>
          <h1 className="text-2xl font-serif text-luxury-black mb-3">Invalid Link</h1>
          <p className="text-sm text-gray-500">
            This password reset link is invalid or has expired. Request a new one from
            the login page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-serif text-luxury-black mb-3">Choose a new password</h1>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
            className="space-y-5 mt-8"
            noValidate
          >
            <Input
              id="password"
              type="password"
              label="New password"
              isMandatory
              register={methods.register}
              labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm password"
              isMandatory
              register={methods.register}
              labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
            />
            <Button type="submit" variant="dark" disabled={isSubmitting} className="w-full h-12">
              {isSubmitting ? "Saving..." : "Reset Password"}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
