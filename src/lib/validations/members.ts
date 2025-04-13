// src/lib/schemas/memberSchemas.ts (or keep within route files if simple)
import { z } from "zod";
import { MemberRole } from "@prisma/client"; // Import enum from Prisma

export const MemberRoleZod = z.nativeEnum(MemberRole);

// Schema for PATCH /api/members (bulk update - original first file)
export const updateMemberBulkSchema = z.object({
  memberId: z.string().cuid({ message: "Invalid Member ID format" }),
  role: MemberRoleZod.optional(),
  isActive: z.boolean().optional(),
});

// Schema for route params with memberId
export const memberParamsSchema = z.object({
  memberId: z.string().cuid({ message: "Invalid Member ID format" }),
});

// Schema for PATCH /api/members/[memberId] body
export const updateMemberDetailsSchema = z
  .object({
    role: MemberRoleZod.optional(),
    isActive: z.boolean().optional(), // Added isActive as it's likely needed
    banned: z.boolean().optional(),
    banReason: z.string().max(255).optional().nullable(), // Add length limits if desired
    banExpires: z
      .string()
      .datetime({ offset: true, message: "Invalid ban expiration date format" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If banning, reason is required. If unbanning or not changing ban status, reason is irrelevant.
      if (
        data.banned === true &&
        (data.banReason === undefined ||
          data.banReason === null ||
          data.banReason.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Ban reason is required when banning a member",
      path: ["banReason"], // Path of the error
    }
  )
  .refine(
    (data) => {
      // If banning and providing an expiry date, it must be in the future.
      if (data.banned === true && data.banExpires) {
        try {
          return new Date(data.banExpires) > new Date();
        } catch {
          return false; // Invalid date format already caught by z.string().datetime()
        }
      }
      return true;
    },
    {
      message: "Ban expiration date must be in the future",
      path: ["banExpires"],
    }
  );

// Schema for DELETE /api/members/[memberId] - only needs params validation
export const deleteMemberParamsSchema = memberParamsSchema; // Reuse the params schema

// Schema for GET /api/members/[memberId] - only needs params validation
export const getMemberParamsSchema = memberParamsSchema; // Reuse the params schema
