"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { FrontendAuthService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("This reset link is invalid or has expired.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const response = await FrontendAuthService.resetPassword(password, token);
    setIsSubmitting(false);

    if (response.success) {
      toast.success("Password reset — please sign in.");
      router.push(`/${locale}/login`);
    } else {
      toast.error(response.error || "Failed to reset password");
    }
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
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
            />
          </div>
          <Button type="submit" variant="dark" disabled={isSubmitting} className="w-full h-12">
            {isSubmitting ? "Saving..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
