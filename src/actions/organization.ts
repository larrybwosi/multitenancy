"use server";

import { Prisma, type Organization, MemberRole, LocationType, InventoryLocation } from '@/prisma/client';
import slugify from "slugify";

import { db as prisma } from "@/lib/db";
import { getServerAuthContext } from "./auth";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AppError, AuthenticationError, ConflictError, DatabaseError, NotFoundError, SlugGenerationError, ValidationError } from '@/utils/errors';
import { z } from 'zod';
import { CreateOrganizationInput, CreateOrganizationInputSchema, UpdateOrganizationInput, UpdateOrganizationInputSchema } from '@/lib/validations/organization';

interface CreationResponse {
  organization: Organization;
  warehouse: InventoryLocation;
}

/**
 * Creates a new organization and assigns the current user as the owner.
 * @param rawData - The data for the new organization.
 * @returns The newly created organization and its default warehouse.
 * @throws Various AppError descendants for specific error conditions.
 */
export async function createOrganization(
  rawData: unknown // Accept unknown to validate first
): Promise<CreationResponse> {
  // 1. Authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new AuthenticationError("User not authenticated.");
  }
  const userId = session.user.id;

  // 2. Validation
  let data: CreateOrganizationInput;
  try {
    data = CreateOrganizationInputSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid input data for creating organization.", error.issues);
    }
    throw new ValidationError("Invalid input data.");
  }

  const {
    name,
    description,
    logo,
    defaultCurrency,
    defaultTimezone,
    defaultTaxRate,
    inventoryPolicy,
    lowStockThreshold,
    negativeStock,
  } = data;

  // 3. Generate a unique slug
  let finalSlug: string;
  try {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    let slugCandidate = baseSlug;
    let counter = 1;
    const MAX_SLUG_ATTEMPTS = 10;

    // Loop to find a unique slug
    while (true) {
      const existing = await prisma.organization.findUnique({
        where: { slug: slugCandidate },
        select: { id: true },
      });
      if (!existing) {
        finalSlug = slugCandidate;
        break;
      }
      if (counter > MAX_SLUG_ATTEMPTS) {
        throw new SlugGenerationError(
          `Failed to generate a unique slug for "${name}" after ${MAX_SLUG_ATTEMPTS} attempts.`
        );
      }
      slugCandidate = `${baseSlug}-${counter}`;
      counter++;
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error during slug generation:", error);
    throw new SlugGenerationError("An unexpected error occurred while generating the slug.");
  }


  // 4. Database Operations
  try {
    const newOrganization = await prisma.organization.create({
      data: {
        id: `org-${finalSlug}`, // Consider using CUIDs or UUIDs if not strictly necessary to have slug in ID
        name,
        slug: finalSlug,
        description,
        logo,
        members: {
          create: {
            // id: `user-org-${finalSlug}-${userId}`, // Prisma can autogenerate CUIDs
            userId,
            role: MemberRole.OWNER,
          },
        },
        settings: {
          create: {
            defaultCurrency,
            defaultTimezone,
            defaultTaxRate: defaultTaxRate !== null && defaultTaxRate !== undefined
              ? new Prisma.Decimal(defaultTaxRate)
              : null,
            inventoryPolicy,
            lowStockThreshold, // Zod ensures it's an int
            negativeStock,
          },
        },
      },
      include: {
        members: { where: { userId } },
        settings: true,
      },
    });

    const mainStore = await prisma.inventoryLocation.create({
      data: {
        name: "Main Store",
        description: "Primary retail store location for " + name,
        locationType: LocationType.RETAIL_SHOP,
        isDefault: true,
        isActive: true,
        capacityTracking: false,
        organizationId: newOrganization.id,
      },
    });

    // Update user's active organization and organization's default location
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { activeOrganizationId: newOrganization.id },
        }),
        prisma.organization.update({
            where: { id: newOrganization.id },
            data: { defaultLocationId: mainStore.id },
        })
    ]);
    
    // Fetch the updated organization to include defaultLocationId in the returned object if needed immediately
    // Or adjust the return type/logic based on whether newOrganization already contains this post-transaction.
    // For simplicity, we return the initially created newOrganization and mainStore.
    // If `defaultLocationId` must be in the returned `newOrganization` object, re-fetch or merge.

    console.log("New Organization Created:", newOrganization.name);
    return { organization: newOrganization, warehouse: mainStore };

  } catch (error) {
    console.error("Failed to create organization:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint violation
        // This might happen in a race condition for the slug despite the check.
        // Or if the id generation `org-${finalSlug}` clashes, though less likely with CUIDs for sub-models.
        const target = (error.meta?.target as string[])?.join(', ');
        throw new ConflictError(
          `An organization with similar attributes (${target || 'slug/id'}) already exists.`
        );
      }
      throw new DatabaseError(`Database error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof AppError) throw error; // Re-throw known app errors
    throw new DatabaseError(`Could not create organization. ${error instanceof Error ? error.message : "Unknown database error"}`);
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
 * Updates an existing organization and its settings.
 * @param organizationId - The ID of the organization to update.
 * @param rawData - The data to update (can include organization and settings fields).
 * @returns The updated organization.
 * @throws Various AppError descendants.
 */
export async function updateOrganization(
  organizationId: string,
  rawData: unknown // Accept unknown to validate first
): Promise<any> { // Replace any with Prisma.OrganizationGetPayload including settings
  // 1. Authorization/Permission Check (Conceptual)
  // ... (as in previous version, ensure user has rights)

  // 2. Validation
  let validatedData: UpdateOrganizationInput;
  try {
    validatedData = UpdateOrganizationInputSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid input data for updating organization.", error.issues);
    }
    throw new ValidationError("Invalid input data.");
  }

  const {
    name,
    description,
    logo,
    // Destructure settings fields
    defaultCurrency,
    defaultTimezone,
    defaultTaxRate,
    inventoryPolicy,
    lowStockThreshold,
    negativeStock,
    enableCapacityTracking,
    enforceSpatialConstraints,
    enableProductDimensions,
    defaultMeasurementUnit,
    defaultDimensionUnit,
    defaultWeightUnit,
  } = validatedData;

  const organizationUpdateData: Prisma.OrganizationUpdateInput = {};
  const settingsUpdateData: Prisma.OrganizationSettingsUpdateInput = {};

  // Populate Organization fields
  if (name !== undefined) organizationUpdateData.name = name;
  if (description !== undefined) organizationUpdateData.description = description;
  if (logo !== undefined) organizationUpdateData.logo = logo;

  // Populate Settings fields
  if (defaultCurrency !== undefined) settingsUpdateData.defaultCurrency = defaultCurrency;
  if (defaultTimezone !== undefined) settingsUpdateData.defaultTimezone = defaultTimezone;
  if (defaultTaxRate !== undefined) { // Handles null explicitly
    settingsUpdateData.defaultTaxRate = defaultTaxRate === null ? null : new Prisma.Decimal(defaultTaxRate);
  }
  if (inventoryPolicy !== undefined) settingsUpdateData.inventoryPolicy = inventoryPolicy;
  if (lowStockThreshold !== undefined) settingsUpdateData.lowStockThreshold = lowStockThreshold;
  if (negativeStock !== undefined) settingsUpdateData.negativeStock = negativeStock;
  if (enableCapacityTracking !== undefined) settingsUpdateData.enableCapacityTracking = enableCapacityTracking;
  if (enforceSpatialConstraints !== undefined) settingsUpdateData.enforceSpatialConstraints = enforceSpatialConstraints;
  if (enableProductDimensions !== undefined) settingsUpdateData.enableProductDimensions = enableProductDimensions;
  if (defaultMeasurementUnit !== undefined) settingsUpdateData.defaultMeasurementUnit = defaultMeasurementUnit;
  if (defaultDimensionUnit !== undefined) settingsUpdateData.defaultDimensionUnit = defaultDimensionUnit;
  if (defaultWeightUnit !== undefined) settingsUpdateData.defaultWeightUnit = defaultWeightUnit;


  // 3. If name is being updated, regenerate the slug
  if (name) {
    try {
      const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
      let finalSlug = baseSlug;
      let counter = 1;
      const MAX_SLUG_ATTEMPTS = 10;

      while (true) {
        const existing = await prisma.organization.findFirst({
          where: {
            slug: finalSlug,
            NOT: { id: organizationId },
          },
          select: { id: true },
        });

        if (!existing) {
          organizationUpdateData.slug = finalSlug; // Add slug to update data
          break;
        }
        if (counter > MAX_SLUG_ATTEMPTS) {
          throw new SlugGenerationError(
            `Failed to generate a unique slug for updated name "${name}" after ${MAX_SLUG_ATTEMPTS} attempts.`
          );
        }
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Error during slug generation for update:", error);
      throw new SlugGenerationError("An unexpected error occurred while generating the new slug.");
    }
  }

  // 4. Database Operation
  // Only include settings update if there's data for it
  if (Object.keys(settingsUpdateData).length > 0) {
    organizationUpdateData.settings = {
      update: settingsUpdateData,
    };
  }
  // Ensure there's something to update overall
  if (Object.keys(organizationUpdateData).length === 0 && Object.keys(settingsUpdateData).length === 0) {
    // Optionally, you could throw an error or return the existing organization if no data to update was provided.
    // For now, let's fetch and return the current org to indicate no change.
    // Or, more strictly, one might require at least one field to be passed for an update.
    const currentOrganization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { settings: true } // Ensure settings are included
    });
    if (!currentOrganization) {
        throw new NotFoundError(`Organization with ID ${organizationId} not found.`);
    }
    return currentOrganization; // No actual update performed
  }


  try {
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: organizationUpdateData,
      include: {
        settings: true, // Ensure settings are included in the response
      },
    });
    return updatedOrganization;
  } catch (error) {
    console.error(`Failed to update organization ${organizationId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[])?.join(', ');
        throw new ConflictError(
          `An organization with the updated attributes (${target || 'name/slug'}) already exists.`
        );
      }
      if (error.code === 'P2025') { // Record to update not found (either Org or related Settings if not handled by nested write correctly)
        // For a nested update on settings, if OrganizationSettings does not exist, P2025 might be "An operation failed because it depends on one or more records that were required but not found. No 'OrganizationSettings' record was found for a nested update on relation 'OrganizationToOrganizationSettings'."
        // This implies the settings record must exist. The createOrganization ensures this.
        throw new NotFoundError(`Organization with ID ${organizationId} or its settings not found for update.`);
      }
      throw new DatabaseError(`Database error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof AppError) throw error;
    throw new DatabaseError(
      `Could not update organization ${organizationId}. ${error instanceof Error ? error.message : "Unknown database error"}`
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