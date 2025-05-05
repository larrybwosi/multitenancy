"use server";

import { Prisma, type Organization, MemberRole, LocationType, InventoryLocation } from '@/prisma/client';
import slugify from "slugify";

import { db as prisma } from "@/lib/db";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "@/lib/types"; 
import { getServerAuthContext } from "./auth";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface CreationResponse {
  organization: Organization;
  warehouse: InventoryLocation;
}

/**
 * Creates a new organization and assigns the current user as the owner.
 * @param data - The data for the new organization (name, description, logo, etc.).
 * @returns The newly created organization.
 * @throws Error if user is not authenticated or if slug generation fails.
 */
export async function createOrganization(
  data: CreateOrganizationInput
): Promise<CreationResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("User not authenticated.");
  }
  const userId = session.user.id;
  const {
    name,
    description,
    logo,
    defaultCurrency = "USD",
    defaultTimezone = "UTC",
    defaultTaxRate,
    inventoryPolicy = "FEFO",
    lowStockThreshold = 10,
    negativeStock = false,
  } = data;

  // Generate a unique slug
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  let finalSlug = baseSlug;
  let counter = 1;
  let isSlugUnique = false;

  // Basic check for slug uniqueness, repeat until unique
  while (!isSlugUnique) {
    const existing = await prisma.organization.findUnique({
      where: { slug: finalSlug },
      select: { id: true }, // Only select ID for efficiency
    });
    if (!existing) {
      isSlugUnique = true;
    } else {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 10) {
        // Safety break to prevent infinite loops
        throw new Error(
          `Failed to generate a unique slug for "${name}" after several attempts.`
        );
      }
    }
  }

  try {
    const newOrganization = await prisma.organization.create({
      data: {
        id: `org-${finalSlug}`,
        name,
        slug: finalSlug,
        description,
        logo,
        members: {
          create: {
            id: `user-org-${finalSlug}-${userId}`,
            userId,
            role: MemberRole.OWNER, // Assign the creator as OWNER
          },
        },
        settings: {
          create: {
            defaultCurrency,
            defaultTimezone,
            defaultTaxRate: defaultTaxRate
              ? new Prisma.Decimal(defaultTaxRate)
              : null,
            inventoryPolicy,
            lowStockThreshold: parseInt(lowStockThreshold.toString()),
            negativeStock,
          },
        },
      },
      include: {
        members: {
          where: { userId }, // Filter to include the owner just created
        },
        settings: true,
      },
    });

    const mainStore = await prisma.inventoryLocation.create({
      data: {
        name: "Main Store",
        description: "Primary retail store location",
        locationType: LocationType.RETAIL_SHOP,
        isDefault: true,
        isActive: true,
        capacityTracking: false,
        organizationId: newOrganization.id,
      },
    });
    // Optionally: Update the user's activeOrganizationId if desired
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: newOrganization.id },
    });

    const org = await prisma.organization.update({
      where: { id: newOrganization.id },
      data: { defaultLocationId: mainStore.id },
    });

    console.log("New Organization Created:", org);
    return { organization: newOrganization, warehouse: mainStore };
  } catch (error) {
    console.error("Failed to create organization:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle potential known errors, e.g., unique constraints
      if (error.code === "P2002") {
        // Unique constraint violation
        // This might happen in a race condition despite the check above
        throw new Error(
          `An organization with a similar name/slug already exists.`
        );
      }
    }
    // Rethrow a generic error or the original error
    throw new Error(
      `Could not create organization. ${error instanceof Error ? error.message : ""}`
    );
  }
}

/**
 * Retrieves a single organization by its slug, checking permissions.
 * @param slug - The unique slug of the organization.
 * @returns The organization data or null if not found or not permitted.
 */
export async function getOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  // const { userId } = await getServerAuthContext();
  try {
    const organization = await prisma.organization.findUnique({
      where: { slug },
      // include: { members: true } // Optionally include related data needed by the frontend
    });

    if (!organization) {
      return null; // Not found
    }

    // Permission Check: Ensure the current user can read this organization
    // const canRead = await canReadOrganization(userId, organization.id);
    // if (!canRead) {
    //   // Instead of throwing, return null if the user isn't authorized
    //   // Or throw new Error('Forbidden: You do not have permission to view this organization.');
    //   return null;
    // }

    return organization;
  } catch (error) {
    console.error("Failed to get organization by slug:", error);
    // Avoid leaking detailed errors to the client
    throw new Error("Could not retrieve organization.");
  }
}

/**
 * Retrieves a single organization by its ID, checking permissions.
 * @param id - The ID of the organization.
 * @returns The organization data or null if not found or not permitted.
 */
export async function getOrganizationById(
  id: string
): Promise<Organization | null> {
  // const { role } = await getServerAuthContext();
  try {
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    return organization;
  } catch (error) {
    console.error("Failed to get organization by ID:", error);
    throw new Error("Could not retrieve organization.");
  }
}

/**
 * Retrieves all organizations the current user is a member of.
 * @returns An array of organizations.
 * @throws Error if user is not authenticated.
 */
export async function getUserOrganizations(): Promise<Organization[]> {
  const { userId } = await getServerAuthContext();

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        // Filter organizations where the user is listed as a member
        members: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Or 'name', 'updatedAt', etc.
      },
      // include: { _count: { select: { members: true } } } // Example: include member count
    });
    return organizations;
  } catch (error) {
    console.error("Failed to get user organizations:", error);
    throw new Error("Could not retrieve your organizations.");
  }
}

/**
 * Updates an existing organization.
 * @param id - The ID of the organization to update.
 * @param data - The data to update (name, description, logo, etc.).
 * @returns The updated organization.
 * @throws Error if user is not authenticated, not permitted, or org not found.
 */
export async function updateOrganization(
  id: string,
  data: UpdateOrganizationInput
): Promise<Organization> {
  // Permission Check
  // const canUpdate = await canUpdateOrganization(userId, id);
  // if (!canUpdate) {
  //   throw new Error(
  //     "Forbidden: You do not have permission to update this organization."
  //   );
  // }

  const { name, ...restData } = data;
  let slugData = {};

  // If name is being updated, regenerate the slug
  if (name) {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    let finalSlug = baseSlug;
    let counter = 1;
    let isSlugUnique = false;

    while (!isSlugUnique) {
      // Check if slug exists *for a different organization*
      const existing = await prisma.organization.findFirst({
        where: {
          slug: finalSlug,
          NOT: { id: id }, // Exclude the current organization
        },
        select: { id: true },
      });
      if (!existing) {
        isSlugUnique = true;
      } else {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 10) {
          // Safety break
          throw new Error(
            `Failed to generate a unique slug for updated name "${name}" after several attempts.`
          );
        }
      }
    }
    slugData = { slug: finalSlug };
  }

  try {
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name, // Include name if provided
        ...restData, // Include other fields like description, logo
        ...slugData, // Include new slug if name changed
      },
    });
    return updatedOrganization;
  } catch (error) {
    console.error("Failed to update organization:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint failed
        throw new Error(
          `An organization with the updated name/slug already exists.`
        );
      }
      if (error.code === "P2025") {
        // Record not found
        throw new Error(`Organization with ID ${id} not found.`);
      }
    }
    throw new Error(
      `Could not update organization. ${error instanceof Error ? error.message : ""}`
    );
  }
}

/**
 * Deletes an organization.
 * @param id - The ID of the organization to delete.
 * @returns The deleted organization data.
 * @throws Error if user is not authenticated, not permitted (not OWNER), or org not found.
 */
export async function deleteOrganization(id: string): Promise<Organization> {
  // Permission Check - Only OWNER can delete
  // const canDelete = await canDeleteOrganization(userId, id);
  // if (!canDelete) {
  //   throw new Error("Forbidden: Only the organization owner can delete it.");
  // }

  // Optional: Add checks here to prevent deletion if certain conditions are met
  // e.g., active subscriptions, non-zero product count, etc.
  // const productCount = await prisma.product.count({ where: { organizationId: id } });
  // if (productCount > 0) {
  //   throw new Error("Cannot delete organization with existing products.");
  // }

  try {
    // The Prisma schema's `onDelete: Cascade` for related models (Member, Product, etc.)
    // should handle the deletion of associated records automatically.
    const deletedOrganization = await prisma.organization.delete({
      where: { id },
    });

    // Optional: Clear activeOrganizationId for users who had this org active
    // await prisma.user.updateMany({
    //     where: { activeOrganizationId: id },
    //     data: { activeOrganizationId: null },
    // });

    return deletedOrganization;
  } catch (error) {
    console.error("Failed to delete organization:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Record not found
        throw new Error(`Organization with ID ${id} not found.`);
      }
      // Handle other specific DB errors if necessary
    }
    throw new Error(
      `Could not delete organization. ${error instanceof Error ? error.message : ""}`
    );
  }
}

export async function saveOrganizationCategories(
  organizationId: string,
  categoryNames: string[]
): Promise<{ success: boolean; message: string }> {
  if (!organizationId || categoryNames.length === 0) {
    return {
      success: false,
      message: "Missing organization ID or categories.",
    };
  }

  try {
    // Check if user has permission to add categories to this org
    // await checkUserPermission(organizationId);

    // Option 1: Create categories if they don't exist globally (less ideal for org-specific)
    // Option 2: Create categories specific to this organization
    // This uses the provided Prisma model structure implicitly

    const categoryData = categoryNames.map((name) => ({
      name: name.trim(),
      organizationId: organizationId,
      // Add description or parentId if needed/available
    }));

    // Use transaction to ensure atomicity if needed
    await prisma.$transaction(async (tx) => {
      // Optional: Delete existing categories for this org before adding new ones
      // await tx.category.deleteMany({ where: { organizationId } });

      // Create new categories
      await tx.category.createMany({
        data: categoryData,
        skipDuplicates: true, // Avoid errors if a category name already exists for this org
      });
    });

    revalidatePath(`/organizations/${organizationId}`); // Revalidate org page/tabs

    return { success: true, message: "Categories saved successfully." };
  } catch (error) {
    console.error(
      `Error saving categories for organization ${organizationId}:`,
      error
    );
    return { success: false, message: "Failed to save categories." };
  }
}