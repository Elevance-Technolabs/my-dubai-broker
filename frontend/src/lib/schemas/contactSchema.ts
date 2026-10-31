import { z } from "zod";
import { emailField, requiredText, selectField } from "./common";

export const contactSchema = z.object({
  fullName: requiredText("Full name", { min: 2, max: 100 }),
  email: emailField("Email"),
  category: selectField("Category"),
  subject: requiredText("Subject", { min: 3, max: 150 }),
  message: requiredText("Message", { min: 10, max: 2000 }),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const defaultContactValues: ContactFormData = {
  fullName: "",
  email: "",
  category: "",
  subject: "",
  message: "",
};
