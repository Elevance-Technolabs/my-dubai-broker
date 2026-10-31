import { z } from "zod";
import {
  emailField,
  passwordField,
  phoneField,
  requiredText,
} from "./common";

export const agentApplicationSchema = z.object({
  fullName: requiredText("Full name", { min: 2, max: 100 }),
  email: emailField("Email"),
  phoneNumber: phoneField("Phone number"),
  agencyName: requiredText("Agency name", { min: 2, max: 150 }),
  licenseNumber: requiredText("License number", { min: 2 }),
  password: passwordField(),
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
