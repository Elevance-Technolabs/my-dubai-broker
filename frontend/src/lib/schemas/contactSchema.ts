import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  category: z.string().min(1, { message: "Please select an option" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  message: z.string().min(1, { message: "Message is required" }),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const defaultContactValues: ContactFormData = {
  fullName: "",
  email: "",
  category: "",
  subject: "",
  message: "",
};
