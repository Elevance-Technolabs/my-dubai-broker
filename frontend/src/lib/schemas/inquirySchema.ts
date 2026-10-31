import { z } from "zod";
import { emailField, optionalPhoneField, requiredText } from "./common";

// Backend (createLeadSchema): customerName >= 1 char, email/phone valid when
// given, message free text. Email and message stay required on this form.
export const inquirySchema = z.object({
  fullName: requiredText("Full name", { max: 100 }),
  email: emailField("Email"),
  phone: optionalPhoneField("Phone number"),
  message: requiredText("Message"),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

export const defaultInquiryValues: InquiryFormData = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};
