// actions/supplier.actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { Supplier, Prisma, MemberRole, StockTransactionType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getBusinessAuthContext } from './business'; // Assuming helper is in business actions

// --- Zod Schemas ---

const OrganisationIdSchema = z.string().cuid({ message: 'Invalid Organisation ID' });
const RequiredCuidSchema = z.string().cuid({ message: 'Required ID is missing or invalid' });

const CreateSupplierSchema = z.object({
  organisationId: OrganisationIdSchema,
  name: z.string().min(2, { message: 'Supplier name is required' }),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email({ message: 'Invalid email format' }).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

const UpdateSupplierSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema, // For auth check
  name: z.string().min(2).optional(),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

const DeleteSupplierSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema,
});

// --- Types ---
type ActionResponse<T = null> = Promise<
  | { success: true; data: T }
  | { success: false; error: string; details?: any }
>;

// --- Actions ---

export async function createSupplier(input: z.infer<typeof CreateSupplierSchema>): ActionResponse<Supplier> {
    try {
        const { organisationId } = input;
        // !! IMPORTANT: Auth Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = CreateSupplierSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        // Check uniqueness (name within org)
        const existing = await db.supplier.findUnique({ where: { organisationId_name: { organisationId, name: validation.data.name } } });
        if (existing) return { success: false, error: `Supplier with name "${validation.data.name}" already exists.` };

        // Check email uniqueness if provided and required by schema/business rules
        if(validation.data.email) {
             const existingEmail = await db.supplier.findFirst({ where: { organisationId, email: validation.data.email }});
            if (existingEmail) return { success: false, error: `Supplier with email ${validation.data.email} already exists.` };
        }

        const newSupplier = await db.supplier.create({ data: validation.data });
        revalidatePath(`/dashboard/${organisationId}/suppliers`);
        return { success: true, data: newSupplier };
    } catch (error) {
        console.error("Create Supplier Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: 'A supplier with this name or email already exists.' };
        }
        return { success: false, error: 'Failed to create supplier.' };
    }
}

export async function updateSupplier(input: z.infer<typeof UpdateSupplierSchema>): ActionResponse<Supplier> {
    try {
        const { organisationId, id } = input;
        console.log(id)
         // !! IMPORTANT: Auth Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = UpdateSupplierSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        const { id: supplierId, organisationId: _, ...updateData } = validation.data;

        // Check uniqueness constraints if fields are being updated
        if (updateData.name) {
            const existing = await db.supplier.findFirst({ where: { organisationId, name: updateData.name, NOT: { id: supplierId } } });
            if (existing) return { success: false, error: `Supplier with name "${updateData.name}" already exists.` };
        }
        if(updateData.email) {
             const existingEmail = await db.supplier.findFirst({ where: { organisationId, email: updateData.email, NOT: { id: supplierId } }});
             if (existingEmail) return { success: false, error: `Supplier with email ${updateData.email} already exists.` };
        }

        const updatedSupplier = await db.supplier.update({
            where: { id: supplierId, organisationId },
            data: updateData,
        });

        revalidatePath(`/dashboard/${organisationId}/suppliers`);
        revalidatePath(`/dashboard/${organisationId}/suppliers/${supplierId}`);
        return { success: true, data: updatedSupplier };
    } catch (error) {
         console.error("Update Supplier Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { success: false, error: 'Supplier not found.' };
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: 'A supplier with this name or email already exists.' };
        }
        return { success: false, error: 'Failed to update supplier.' };
    }
}

export async function deleteSupplier(input: z.infer<typeof DeleteSupplierSchema>): ActionResponse<{ id: string }> {
  try {
    const { organisationId, id } = input;
    // !! IMPORTANT: Auth Check !!
    await getBusinessAuthContext(organisationId, MemberRole.ADMIN); // Only admin deletes suppliers?

    const validation = DeleteSupplierSchema.safeParse(input);
    if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

    // Check if supplier is linked to Stock entries
    const stockCount = await db.stock.count({ where: { supplierId: id, organisationId }});
    if (stockCount > 0) {
        // Option 1: Prevent deletion
        return { success: false, error: `Cannot delete supplier: Linked to ${stockCount} stock entries. Unlink stock first.` };
          // Option 2: Allow deletion (Prisma relation `onDelete: SetNull` handles unlinking)
    }

    await db.supplier.delete({ where: { id, organisationId } });

    revalidatePath(`/dashboard/${organisationId}/suppliers`);
    return { success: true, data: { id } };
  } catch (error) {
      console.error("Delete Supplier Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
          return { success: false, error: 'Supplier not found.' };
      }
      return { success: false, error: 'Failed to delete supplier.' };
  }
}


// --- Read Actions ---

export async function getSuppliers(organisationId: string): ActionResponse<Supplier[]> {
  try {
    await getBusinessAuthContext(organisationId);
    const suppliers = await db.supplier.findMany({
        where: { organisationId },
        orderBy: { name: 'asc' }
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
      console.error("Get Suppliers Error:", error);
      return { success: false, error: error.message || "Failed to fetch suppliers." };
  }
}

export async function getSupplier(organisationId: string, supplierId: string): ActionResponse<Supplier | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const supplier = await db.supplier.findUnique({
        where: { id: supplierId, organisationId },
    });
      if (!supplier) {
        return { success: false, error: 'Supplier not found.' };
    }
    return { success: true, data: supplier };
  } catch (error: any) {
      console.error("Get Supplier Error:", error);
      return { success: false, error: error.message || "Failed to fetch supplier details." };
  }
}

export async function getSupplierStockHistory(organisationId: string, supplierId: string): ActionResponse<any[]> { // Define a better return type
    try {
      await getBusinessAuthContext(organisationId);
      // Find stock entries linked to this supplier
      const stockEntries = await db.stock.findMany({
          where: { supplierId: supplierId, organisationId },
          include: {
              product: { select: { name: true, sku: true }},
              // Include transactions related ONLY to the PURCHASE of THESE stock entries?
              // This can get complex. Simpler: return stock entries.
              stockTransactions: {
                  where: { type: StockTransactionType.PURCHASE }, // Only purchase transactions
                  select: { transactionDate: true, quantityChange: true, attachmentUrl: true }
              }
          },
          orderBy: { purchaseDate: 'desc' }
      });

      // Maybe simplify the return structure
        const history = stockEntries.map(entry => ({
          stockId: entry.id,
          productId: entry.productId,
          productName: entry.product.name,
          productSku: entry.product.sku,
          batchNumber: entry.batchNumber,
          purchaseDate: entry.purchaseDate,
          expiryDate: entry.expiryDate,
          quantityPurchased: entry.stockTransactions[0]?.quantityChange, // Assuming one purchase transaction per stock entry
          buyingPricePerUnit: entry.buyingPricePerUnit,
          unit: entry.unit,
          attachmentUrl: entry.stockTransactions[0]?.attachmentUrl,
        }));


      return { success: true, data: history };
    } catch (error: any) {
        console.error("Get Supplier Stock History Error:", error);
        return { success: false, error: error.message || "Failed to fetch supplier stock history." };
    }
}