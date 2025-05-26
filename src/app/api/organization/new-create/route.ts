import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { PrismaClient, InventoryPolicy, Prisma, LocationType, MemberRole } from '@/prisma/client';
import { ApprovalWorkflowInput, WorkflowResult } from '@/lib/validations/approval';
import { createApprovalWorkflow } from '@/actions/approval';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { AuthenticationError } from '@/utils/errors';
import prisma from '@/lib/db';
import { seedOrganizationUnits } from '@/actions/units';
/**
 * Helper function to preprocess string or number inputs into numbers.
 * Returns undefined if the input cannot be converted to a valid number.
 * @param val - The input value (string, number, or unknown).
 * @returns A number or undefined.
 */
const toNumber = (val: unknown): number | undefined => {
  if (typeof val === 'number') {
    // If the number is an integer (no decimal part), assume it's a percentage
    const isInteger = Number.isInteger(val);
    const result = isInteger ? val / 100 : val;
    return Number(result.toFixed(4)); // Round to 4 decimal places
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const num = parseFloat(val);
    if (isNaN(num)) return undefined;
    // If the string represents an integer (e.g., "16"), assume it's a percentage
    const isIntegerString = /^[0-9]+$/.test(val.trim());
    const result = isIntegerString ? num / 100 : num;
    return Number(result.toFixed(4)); // Round to 4 decimal places
  }
  return undefined;
};

/**
 * Helper function to preprocess string or number inputs into integers.
 * @param val - The input value.
 * @returns An integer or undefined.
 */
const toInt = (val: unknown): number | undefined => {
  const num = toNumber(val);
  return num !== undefined ? Math.round(num) : undefined;
};

// Define the Zod schema for organization creation payload validation
const OrganizationCreateSchema = z.object({
  name: z.string({ required_error: 'Organization name is required.' }).min(1, 'Organization name cannot be empty.'),
  description: z.string().optional().or(z.literal('')),
  logo: z.string().url('Invalid logo URL format.').optional().or(z.literal('')),
  expenseApprovalThreshold: z.preprocess(toNumber, z.number().min(0).optional()),
  expenseReceiptThreshold: z.preprocess(toNumber, z.number().min(0).optional()),
  defaultCurrency: z.string().min(3).max(3).optional().default('USD'),
  taxRate: z.preprocess(
    toNumber,
    z
      .number()
      .min(0, 'Tax rate cannot be negative.')
      .max(9.9999, 'Tax rate must be less than or equal to 9.9999 (e.g., 999.99% if input as a percentage).')
      .refine(
        val => val === undefined || Number(val.toFixed(4)) === val,
        'Tax rate must have at most 4 decimal places.'
      )
      .optional()
  ),
  inventoryPolicy: z.nativeEnum(InventoryPolicy).optional().default('FEFO'),
  lowStockThreshold: z.preprocess(toInt, z.number().int().min(0).optional()).default(10),
  autoCheckoutTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm).')
    .optional(),
});

/**
 * Generates a unique slug for an organization.
 * If the initial slug exists, it appends a short random string and checks again.
 * @param name - The organization name.
 * @param tx - The Prisma transaction client.
 * @returns A unique slug string.
 * @throws An error if a unique slug cannot be generated after several attempts.
 */
async function generateUniqueSlug(name: string, tx: PrismaClient | any): Promise<string> {
  let slug = slugify(name, { lower: true, strict: true, trim: true });
  let isUnique = false;
  let attempt = 0;
  const maxAttempts = 5; // Max attempts to find a unique slug

  while (!isUnique && attempt < maxAttempts) {
    const existingOrg = await tx.organization.findUnique({
      where: { slug },
    });

    if (!existingOrg) {
      isUnique = true;
    } else {
      attempt++;
      const randomSuffix = Math.random().toString(36).substring(2, 6); // 4-char random string
      slug = `${slugify(name, { lower: true, strict: true, trim: true })}-${randomSuffix}`;
    }
  }

  if (!isUnique) {
    throw new Error('Could not generate a unique slug. Please try a different organization name.');
  }

  return slug;
}

/**
 * Next.js API Route Handler for POST requests to create an organization.
 * @param req - The NextRequest object.
 * @returns A NextResponse object with the result or an error.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user?.id) {
        throw new AuthenticationError('User not authenticated.');
      }
      const userId = session.user.id;
    // 1. Validate the incoming payload
    const validationResult = OrganizationCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 2. Perform database operations within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2a. Generate a unique slug
      const uniqueSlug = await generateUniqueSlug(validatedData.name, tx);

      // 2b. Create the Organization record
      const organization = await tx.organization.create({
        data: {
          name: validatedData.name,
          slug: uniqueSlug,
          description: validatedData.description,
          logo: validatedData.logo,
          expenseApprovalThreshold: validatedData.expenseApprovalThreshold,
          expenseReceiptThreshold: validatedData.expenseReceiptThreshold,
          defaultExpenseCurrency: validatedData.defaultCurrency,
          expenseApprovalRequired: validatedData.expenseApprovalThreshold != null,
          expenseReceiptRequired: true,
          members: {
            create: {
              userId,
              role: MemberRole.OWNER,
            },
          },
        },
      });
      
      // Create main store
      const mainStore = await tx.inventoryLocation.create({
        data: {
          name: 'Main Store',
          description: `Primary retail store location for ${organization.name}`,
          locationType: LocationType.RETAIL_SHOP,
          isDefault: true,
          isActive: true,
          capacityTracking: false,
          organizationId: organization.id,
        },
      });

      // 2c. Create the associated OrganizationSettings record
      await tx.organizationSettings.create({
        data: {
          organizationId: organization.id,
          defaultCurrency: validatedData.defaultCurrency,
          defaultTaxRate: validatedData.taxRate,
          inventoryPolicy: validatedData.inventoryPolicy,
          lowStockThreshold: validatedData.lowStockThreshold,
          autoCheckoutTime: validatedData.autoCheckoutTime,
          negativeStock: false,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: organization.id },
      });

      await tx.organization.update({
        where: { id: organization.id },
        data: { defaultLocationId: mainStore.id },
      });

      // 2d. Create an approval workflow if expenseApprovalThreshold is provided
      let workflowResult: WorkflowResult | undefined;
      if (validatedData.expenseApprovalThreshold != null) {
        const workflowData: ApprovalWorkflowInput = {
          name: `${validatedData.name} Default Expense Approval`,
          description: `Default approval workflow for expenses exceeding ${validatedData.expenseApprovalThreshold} ${validatedData.defaultCurrency}`,
          isActive: true,
          steps: [
            {
              stepNumber: 1,
              name: 'Expense Approval Step',
              description: 'Approves expenses above the threshold',
              allConditionsMustMatch: true,
              conditions: [
                {
                  type: 'AMOUNT_RANGE',
                  minAmount: validatedData.expenseApprovalThreshold,
                },
              ],
              actions: [
                {
                  type: 'ROLE',
                  approvalMode: 'ALL',
                  approverRole: 'ADMIN',
                },
              ],
            },
          ],
        };

        console.log(organization)
        workflowResult = await createApprovalWorkflow(organization.id, workflowData, prisma, tx);
        if (!workflowResult.success) {
          throw new Error(`Failed to create approval workflow: ${workflowResult.message}`);
        }
      }
      
      // Seed organization units using the transaction client
      await seedOrganizationUnits(organization.id, prisma, tx);

      return { organization, workflowResult, mainStore };
    });

    // 3. Return a success response
    const response = {
      organization: result.organization,
      warehouse: result.mainStore

    };
    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Organization creation failed:', error);

    // Handle Zod errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }

    // Handle slug generation error
    if (error.message.includes('unique slug')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Handle workflow creation error
    if (error.message.includes('Failed to create approval workflow')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: `A record with this value already exists.`, details: error.meta?.target },
          { status: 409 }
        );
      }
      if (error.message.includes('numeric field overflow')) {
        return NextResponse.json(
          {
            error: 'Numeric field overflow in tax rate.',
            details: 'Tax rate must be between 0 and 9.9999 (e.g., 999.99% if input as a percentage) with up to 4 decimal places.',
          },
          { status: 400 }
        );
      }
    }

    // Handle generic errors
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}