import { z } from "zod";
import { emailField, requiredText } from "./common";

// Login checks presence only: the password rule (8+) applies when it is set,
// and rejecting shorter legacy passwords here would lock people out.
export const loginSchema = z.object({
  email: emailField("Email"),
  password: requiredText("Password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const defaultLoginValues: LoginFormData = {
  email: "",
  password: "",
};
