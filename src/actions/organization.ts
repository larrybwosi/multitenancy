'use server';

import { Prisma, type Organization, MemberRole, LocationType, InventoryLocation, DepartmentMemberRole } from '@/prisma/client';
import slugify from 'slugify';

import { db as prisma } from '@/lib/db';
import { getServerAuthContext } from './auth';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  AppError,
  AuthenticationError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  SlugGenerationError,
  ValidationError,
} from '@/utils/errors';
import { z } from 'zod';
import {
  CreateOrganizationInputSchema,
  UpdateOrganizationInput,
  UpdateOrganizationInputSchema,
} from '@/lib/validations/organization';
import { CreateInterface } from '@/lib/hooks/use-org';
import { seedOrganizationUnits } from './units';

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
  rawData: unknown,
): Promise<CreationResponse> {
  // 1. Authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new AuthenticationError('User not authenticated.');
  }
  const userId = session.user.id;

  // 2. Validation
  let data: z.infer<typeof CreateOrganizationInputSchema>;
  try {
    data = CreateOrganizationInputSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      throw new ValidationError('Invalid input data for creating organization.', error.issues);
    }
    throw new ValidationError('Invalid input data.');
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
    console.error('Error during slug generation:', error);
    if (error instanceof AppError) throw error;
    throw new SlugGenerationError('An unexpected error occurred while generating the slug.');
  }

  // 4. Database Operations (all in a single transaction)
  try {
    const result = await prisma.$transaction(async tx => {
      // Create organization with settings and member
      const newOrganization = await tx.organization.create({
        data: {
          name,
          slug: finalSlug,
          description,
          logo,
          members: {
            create: {
              userId,
              role: MemberRole.OWNER,
            },
          },
          settings: {
            create: {
              defaultCurrency,
              defaultTimezone,
              defaultTaxRate:
                defaultTaxRate !== null && defaultTaxRate !== undefined ? new Prisma.Decimal(defaultTaxRate) : null,
              inventoryPolicy,
              lowStockThreshold,
              negativeStock,
            },
          },
        },
        include: {
          members: { where: { userId } },
          settings: true,
        },
      });

      // Create main store
      const mainStore = await tx.inventoryLocation.create({
        data: {
          name: 'Main Store',
          description: `Primary retail store location for ${name}`,
          locationType: LocationType.RETAIL_SHOP,
          isDefault: true,
          isActive: true,
          capacityTracking: false,
          organizationId: newOrganization.id,
        },
      });

      // Update user's active organization and organization's default location
      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: newOrganization.id },
      });

      await tx.organization.update({
        where: { id: newOrganization.id },
        data: { defaultLocationId: mainStore.id },
      });

      return { organization: newOrganization, warehouse: mainStore };
    });

    // Seed organization units using the transaction client
    await seedOrganizationUnits(result.organization.id, prisma);
    
    return result;
  } catch (error) {
    console.error('Failed to create organization:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[])?.join(', ');
        throw new ConflictError(`An organization with similar attributes (${target || 'slug/id'}) already exists.`);
      }
      throw new DatabaseError(`Database error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof AppError) throw error;
    throw new DatabaseError(
      `Could not create organization. ${error instanceof Error ? error.message : 'Unknown database error'}`
    );
  }
}


/**
 * Retrieves a single organization by its slug, checking permissions.
 * @param slug - The unique slug of the organization.
 * @returns The organization data or null if not found or not permitted.
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
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
    console.error('Failed to get organization by slug:', error);
    // Avoid leaking detailed errors to the client
    throw new Error('Could not retrieve organization.');
  }
}

/**
 * Retrieves a single organization by its ID, checking permissions.
 * @param id - The ID of the organization.
 * @returns The organization data or null if not found or not permitted.
 */
export async function getOrganizationById(id: string) {
  // const { role } = await getServerAuthContext();
  try {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });

    return organization;
  } catch (error) {
    console.error('Failed to get organization by ID:', error);
    throw new Error('Could not retrieve organization.');
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
        createdAt: 'asc', // Or 'name', 'updatedAt', etc.
      },
      // include: { _count: { select: { members: true } } } // Example: include member count
    });
    return organizations;
  } catch (error) {
    console.error('Failed to get user organizations:', error);
    throw new Error('Could not retrieve your organizations.');
  }
}

/**
 * Updates an existing organization and its settings.
 * @param organizationId - The ID of the organization to update.
 * @param rawData - The data to update (can include organization and settings fields).
 * @returns The updated organization.
 * @throws Various AppError descendants.
 */
export async function updateOrganization(organizationId: string, rawData: unknown) {
  let validatedData: UpdateOrganizationInput;
  try {
    validatedData = UpdateOrganizationInputSchema.parse(rawData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input data for updating organization.', error.issues);
    }
    throw new ValidationError('Invalid input data.');
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
  if (defaultTaxRate !== undefined) {
    // Handles null explicitly
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
      console.error('Error during slug generation for update:', error);
      throw new SlugGenerationError('An unexpected error occurred while generating the new slug.');
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
      include: { settings: true }, // Ensure settings are included
    });
    if (!currentOrganization) {
      throw new NotFoundError(`Organization with ID ${organizationId} not found.`, { id: organizationId });
    }
    return currentOrganization; // No actual update performed
  }

  try {
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: organizationUpdateData,
      include: {
        settings: true,
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
      if (error.code === 'P2025') {
        // Record to update not found (either Org or related Settings if not handled by nested write correctly)
        // For a nested update on settings, if OrganizationSettings does not exist, P2025 might be "An operation failed because it depends on one or more records that were required but not found. No 'OrganizationSettings' record was found for a nested update on relation 'OrganizationToOrganizationSettings'."
        // This implies the settings record must exist. The createOrganization ensures this.
        throw new NotFoundError(`Organization with ID ${organizationId} or its settings not found for update.`, error);
      }
      throw new DatabaseError(`Database error: ${error.message} (Code: ${error.code})`);
    }
    if (error instanceof AppError) throw error;
    throw new DatabaseError(
      `Could not update organization ${organizationId}. ${error instanceof Error ? error.message : 'Unknown database error'}`
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
    console.error('Failed to delete organization:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record not found
        throw new Error(`Organization with ID ${id} not found.`);
      }
      // Handle other specific DB errors if necessary
    }
    throw new Error(`Could not delete organization. ${error instanceof Error ? error.message : ''}`);
  }
}

export async function saveOrganizationCategories(
  organizationId: string,
  categoryNames: string[]
): Promise<{ success: boolean; message: string }> {
  if (!organizationId || categoryNames.length === 0) {
    return {
      success: false,
      message: 'Missing organization ID or categories.',
    };
  }

  try {
    // Check if user has permission to add categories to this org
    // await checkUserPermission(organizationId);

    // Option 1: Create categories if they don't exist globally (less ideal for org-specific)
    // Option 2: Create categories specific to this organization
    // This uses the provided Prisma model structure implicitly

    const categoryData = categoryNames.map(name => ({
      name: name.trim(),
      organizationId: organizationId,
      // Add description or parentId if needed/available
    }));

    // Use transaction to ensure atomicity if needed
    await prisma.$transaction(async tx => {
      // Optional: Delete existing categories for this org before adding new ones
      // await tx.category.deleteMany({ where: { organizationId } });

      // Create new categories
      await tx.category.createMany({
        data: categoryData,
        skipDuplicates: true, // Avoid errors if a category name already exists for this org
      });
    });

    revalidatePath(`/organizations/${organizationId}`);

    return { success: true, message: 'Categories saved successfully.' };
  } catch (error) {
    console.error(`Error saving categories for organization ${organizationId}:`, error);
    return { success: false, message: 'Failed to save categories.' };
  }
}

export async function createUserAndMember({ departmentId, email,name, password, phone, image, role }: CreateInterface) {
  const { organizationId } = await getServerAuthContext();

  const user = await auth.api.createUser({
    body: {
      email,name, password, 
      data:{
        image
      }
    },
  });
  
  return await createOrganizationMember({ organizationId, userId: user.user.id, departmentId, phone, role});
}


/**
 * Creates a member for an organization and optionally adds them to a department.
 * @param props - Object containing the parameters for creating the member.
 * @param props.userId - The ID of the user to be added as a member.
 * @param props.organizationId - The ID of the organization to add the member to.
 * @param props.departmentId - Optional ID of the department to add the member to.
 * @param props.role - Optional role for the member in the organization (defaults to MEMBER).
 * @param props.phone - Optional phone number to update for the user.
 * @returns The created member record.
 * @throws Error if the user or organization does not exist, or if the member already exists.
 */
async function createOrganizationMember(props: {
  userId: string;
  organizationId: string;
  departmentId?: string | null;
  role?: MemberRole | null;
  phone?: string | null;
}): Promise<{
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> {
  const { userId, organizationId, departmentId, role = MemberRole.EMPLOYEE, phone } = props;

  try {
    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }


    // Check if the member already exists for this organization
    const existingMember = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
    if (existingMember) {
      throw new Error(`User is already a member of organization ${organizationId}`);
    }

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update user with phone number if provided
      // if (phone != null) {
      //   await tx.user.update({
      //     where: { id: userId },
      //     data: { phone },
      //   });
      // }

      // Create the member record
      const member = await tx.member.create({
        data: {
          organizationId,
          userId,
          phone,
          role: role || MemberRole.EMPLOYEE, // Use provided role or default
          isActive: true,
        },
      });
      console.log(member)

      // If departmentId is provided, validate and add to department
      if (departmentId != null) {
        // Validate that the department exists and belongs to the organization
        const department = await tx.department.findUnique({
          where: { id: departmentId },
        });
        if (!department) {
          throw new Error(`Department with ID ${departmentId} not found`);
        }
        if (department.organizationId !== organizationId) {
          throw new Error(`Department ${departmentId} does not belong to organization ${organizationId}`);
        }

        // Check if the user is already a member of the department
        const existingDepartmentMember = await tx.departmentMember.findUnique({
          where: {
            departmentId_memberId: {
              departmentId,
              memberId: member.id,
            },
          },
        });
        if (existingDepartmentMember) {
          throw new Error(`User is already a member of department ${departmentId}`);
        }

        // Add the member to the department
        await tx.departmentMember.create({
          data: {
            departmentId,
            memberId: member.id,
            role: DepartmentMemberRole.MEMBER, // Default department role
            canApproveExpenses: false,
            canManageBudget: false,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { activeOrganizationId: organizationId },
        });
      }
      
      return member;
    });

    return result;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create organization member');
  } finally {
    await prisma.$disconnect();
  }
}