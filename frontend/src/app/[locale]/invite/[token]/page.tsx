"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import {
  acceptInvitationSchema,
  type AcceptInvitationData,
} from "@/lib/schemas/accountSchemas";
import {
  applyServerFieldErrors,
  summarizeFieldErrors,
} from "@/lib/utils/formErrors";
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

  const methods = useForm<AcceptInvitationData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    InvitationService.getByToken(token)
      .then((response) => {
        if (response.success && response.data) {
          setInvitation(response.data);
        } else {
          setError(response.error || "This invitation is no longer valid.");
        }
      })
      .catch(() => setError("Could not load this invitation. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  const onSubmit = async (data: AcceptInvitationData) => {
    setIsSubmitting(true);
    try {
      const response = await InvitationService.accept(token, {
        name: data.name.trim(),
        password: data.password,
      });

      if (response.success) {
        setAccepted(true);
        toast.success("Account created. You can now sign in.");
      } else {
        const unmapped = applyServerFieldErrors(
          methods.setError,
          response.fieldErrors,
          {},
          ["name", "password"],
        );
        toast.error(response.error || "Failed to accept invitation", {
          description: unmapped.length ? unmapped.join("; ") : undefined,
        });
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

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
            className="space-y-5"
            noValidate
          >
            <Input
              id="name"
              label="Full name"
              isMandatory
              register={methods.register}
              labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
            />
            <Input
              id="password"
              type="password"
              label="Password"
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
            <Button
              type="submit"
              variant="dark"
              disabled={isSubmitting}
              className="w-full h-12"
            >
              {isSubmitting ? "Creating account..." : "Accept & Create Account"}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
