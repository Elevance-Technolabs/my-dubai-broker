import { z } from "zod";

export const inquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

export const defaultInquiryValues: InquiryFormData = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};
