// lib/validators/organization.ts
import * as z from "zod";
import { BusinessType, ModuleAccess } from "@prisma/client"; // Adjust import path if needed

// Helper for optional string to number conversion
const optionalStringToNumber = z.preprocess(
  (val) =>
    val === "" || val === null || val === undefined ? undefined : Number(val),
  z.number().optional()
);

export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Organization name must be at least 2 characters long.",
    }),
  logo: z
    .string()
    .url({ message: "Please enter a valid URL for the logo." })
    .optional()
    .or(z.literal("")),
  // address: z.string().min(5, { message: "Address is required." }),
  // city: z.string().min(2, { message: "City is required." }),
  // state: z.string().min(2, { message: "State/Province is required." }),
  // zipCode: z.string().min(3, { message: "Zip/Postal code is required." }),
  // country: z.string().min(2, { message: "Country is required." }),
  // phone: z.string().min(10, { message: "A valid phone number is required." }), // Basic length check
  // email: z.string().email({ message: "Please enter a valid email address." }),
  // website: z
  //   .string()
  //   .url({ message: "Please enter a valid website URL." })
  //   .optional()
  //   .or(z.literal("")),
  // taxId: z.string().optional(),
  // taxRate: z.preprocess(
  //   // Ensure conversion from string input
  //   (val) => Number(val),
  //   z
  //     .number()
  //     .min(0, { message: "Tax rate cannot be negative." })
  //     .max(100, { message: "Tax rate seems too high." })
  //     .default(8)
  // ),
  // type: z.nativeEnum(BusinessType).default(BusinessType.RETAIL),
  // currency: z
  //   .string()
  //   .min(3, { message: "Currency code required (e.g., KES)." })
  //   .max(3)
  //   .default("KES"),
  // timeZone: z.string().default("Africa/Nairobi"), // Consider a dropdown with valid timezones
  // defaultLanguage: z.string().min(2).max(5).default("en"),
  // activeModules: z
  //   .array(z.nativeEnum(ModuleAccess))
  //   .min(1, { message: "At least one module must be selected." })
  //   .default([
  //     ModuleAccess.INVENTORY,
  //     ModuleAccess.POS,
  //     ModuleAccess.REPORTING,
  //     ModuleAccess.CUSTOMERS,
  //   ]),
  // // Subscription fields usually set server-side or in a different process
  // // customization fields (optional for creation form, maybe in settings later)
  // primaryColor: z
  //   .string()
  //   .regex(/^#[0-9A-F]{6}$/i, {
  //     message: "Must be a valid hex color code (e.g. #4f46e5)",
  //   })
  //   .optional()
  //   .or(z.literal("")),
  // secondaryColor: z
  //   .string()
  //   .regex(/^#[0-9A-F]{6}$/i, {
  //     message: "Must be a valid hex color code (e.g. #f97316)",
  //   })
  //   .optional()
  //   .or(z.literal("")),
  // receiptHeader: z.string().optional(),
  // receiptFooter: z.string().optional(),
  // Other fields like invoiceTemplate, tableLayout, theme, customFields might be too complex for initial creation
});

export type OrganizationCreationData = z.infer<typeof organizationSchema>;
