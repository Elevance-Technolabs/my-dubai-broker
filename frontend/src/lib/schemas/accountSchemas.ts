import { z } from "zod";
import {
  emailField,
  optionalPhoneField,
  optionalText,
  passwordField,
  requiredText,
} from "./common";

export const forgotPasswordSchema = z.object({
  email: emailField("Email"),
});
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

const withPasswordMatch = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).superRefine((data, ctx) => {
    const d = data as { password?: string; confirmPassword?: string };
    if (d.confirmPassword && d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const resetPasswordSchema = withPasswordMatch({
  password: passwordField("New password"),
  confirmPassword: requiredText("Confirm password"),
});
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Backend acceptInvitationSchema: name >= 1, password >= 8.
export const acceptInvitationSchema = withPasswordMatch({
  name: requiredText("Full name", { min: 2, max: 100 }),
  password: passwordField(),
  confirmPassword: requiredText("Confirm password"),
});
export type AcceptInvitationData = z.infer<typeof acceptInvitationSchema>;

// Roles the backend allows to be invited (INVITABLE_ROLES).
export const INVITE_ROLE_VALUES = [
  "company_manager",
  "agent",
  "listing_coordinator",
  "viewer",
] as const;

export const inviteSchema = z.object({
  email: emailField("Email"),
  role: z.enum(INVITE_ROLE_VALUES, { error: "Please select a role" }),
});
export type InviteData = z.infer<typeof inviteSchema>;

// Backend updateProfileSchema: displayName >= 1, valid email, photo optional.
export const profileSchema = z.object({
  displayName: requiredText("Display name", { max: 100 }),
  bio: optionalText("Bio", 1000),
  phone: optionalPhoneField("Phone number"),
  whatsapp: optionalPhoneField("WhatsApp number"),
  email: z.union([z.literal(""), emailField("Email")]).optional(),
  languages: z.string().optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const reasonSchema = (label = "Reason") =>
  z.object({ reason: requiredText(label, { min: 3, max: 500 }) });
