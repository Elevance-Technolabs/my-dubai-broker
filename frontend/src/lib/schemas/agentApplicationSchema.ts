import { z } from "zod";

export const agentApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(7, "Invalid phone number"),
  agencyName: z.string().min(2, "Agency name is required"),
  licenseNumber: z.string().min(2, "License number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type AgentApplicationData = z.infer<typeof agentApplicationSchema>;

export const defaultApplicationValues: AgentApplicationData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  agencyName: "",
  licenseNumber: "",
  password: "",
  agreeToTerms: false,
};
