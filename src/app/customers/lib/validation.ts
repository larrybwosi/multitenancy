import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters long.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  company: z.string().optional(), // Making company optional
  status: z.enum(["active", "inactive", "pending"], {
    required_error: "Please select a customer status.", // Error if no value selected
  }),
  // We won't ask for loyalty points or avatar in the form, set defaults later
});

export type CustomerFormData = z.infer<typeof customerSchema>;
