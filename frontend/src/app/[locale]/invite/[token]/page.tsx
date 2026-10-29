"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  InvitationService,
  type InvitationPreview,
} from "@/services/invitation.service";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    InvitationService.getByToken(token).then((response) => {
      if (response.success && response.data) {
        setInvitation(response.data);
      } else {
        setError(response.error || "This invitation is no longer valid.");
      }
      setLoading(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter your full name");
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
    const response = await InvitationService.accept(token, {
      name: name.trim(),
      password,
    });
    setIsSubmitting(false);

    if (response.success) {
      setAccepted(true);
      toast.success("Account created — you can now sign in.");
    } else {
      toast.error(response.error || "Failed to accept invitation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center border border-gray-100 p-12">
          <XCircle size={40} className="text-rose-500 mx-auto mb-6" />
          <h1 className="text-2xl font-serif text-luxury-black mb-3">
            Invitation Unavailable
          </h1>
          <p className="text-sm text-gray-500">
            {error || "This invitation could not be found."}
          </p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center border border-gray-100 p-12">
          <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-serif text-luxury-black mb-3">
            You're all set
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Your account has been created for {invitation.companyName}. Sign in to
            get started.
          </p>
          <Button variant="dark" className="w-full" onClick={() => router.push("/login")}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-gray-100 p-12">
        <p className="text-[10px] uppercase tracking-widest text-luxury-gold mb-3">
          {invitation.companyName}
        </p>
        <h1 className="text-2xl font-serif text-luxury-black mb-2">
          Join as {invitation.role.replace("_", " ")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          You've been invited to join {invitation.companyName} on My Dubai
          Broker. Set a password to finish creating your account for{" "}
          <span className="font-medium text-luxury-black">{invitation.email}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
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
          <Button
            type="submit"
            variant="dark"
            disabled={isSubmitting}
            className="w-full h-12"
          >
            {isSubmitting ? "Creating account..." : "Accept & Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
