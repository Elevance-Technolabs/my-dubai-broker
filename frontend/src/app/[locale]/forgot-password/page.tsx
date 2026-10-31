"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import {
  forgotPasswordSchema,
  type ForgotPasswordData,
} from "@/lib/schemas/accountSchemas";
import { summarizeFieldErrors } from "@/lib/utils/formErrors";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { FrontendAuthService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const { locale } = useParams();
  const methods = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const email = methods.watch("email");

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsSubmitting(true);
    try {
      const response = await FrontendAuthService.forgotPassword(
        data.email.trim(),
        `/${locale}/reset-password`,
      );
      if (response.success) {
        toast.success("If that email has an account, a reset link is on its way.");
        setSent(true);
      } else {
        toast.error(response.error || "Failed to send reset email");
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-serif text-luxury-black mb-3">
          Reset your password
        </h1>

        {sent ? (
          <p className="text-sm text-gray-500">
            If an account exists for <strong>{email}</strong>, we've sent a link to
            reset your password. Check your inbox (and check the backend logs for now —
            email delivery is a placeholder until a real provider is wired in).
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-8">
              Enter the email address on your account and we'll send you a link to reset
              your password.
            </p>
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
                className="space-y-5"
                noValidate
              >
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  isMandatory
                  register={methods.register}
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Button type="submit" variant="dark" disabled={isSubmitting} className="w-full h-12">
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </FormProvider>
          </>
        )}

        <Link
          href={`/${locale}/login`}
          className="block mt-8 text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
