"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { FrontendAuthService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const { locale } = useParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }

    setIsSubmitting(true);
    const response = await FrontendAuthService.forgotPassword(
      email.trim(),
      `/${locale}/reset-password`,
    );
    setIsSubmitting(false);

    if (response.success) {
      setSent(true);
    } else {
      toast.error(response.error || "Failed to send reset email");
    }
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="dark" disabled={isSubmitting} className="w-full h-12">
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
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
