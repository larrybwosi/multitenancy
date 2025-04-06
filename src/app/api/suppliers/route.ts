// app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { Supplier } from "@prisma/client";
import { SupplierSchema } from "@/lib/validations/schemas";


export async function POST(request: NextRequest) {
  // Add Auth checks here

  try {
    const body = await request.json();
    const validationResult = SupplierSchema.safeParse(body); 

    if (!validationResult.success) {
      // Format Zod errors for a user-friendly response
      const errors = validationResult.error.flatten().fieldErrors;
      console.error("Validation Errors:", errors);
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 } // Bad Request
      );
    }

    // Data is validated, proceed using validationResult.data
    const validatedData = validationResult.data;

    const newSupplier: Supplier = await prisma.supplier.create({
      data: validatedData, // Use the validated data
    });

    return NextResponse.json(newSupplier, { status: 201 });

  } catch (error: any) {
    console.error('Failed to add supplier:', error);
     if (error?.code === 'P2002' && error?.meta?.target?.includes('name')) {
         return NextResponse.json({ error: 'Supplier name already exists' }, { status: 409 }); // Conflict
     }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Apply similar validation logic using safeParse in PUT routes (using Update schemas)
// and other POST routes (using their respective Create schemas).

export async function GET(request: NextRequest) {
  // Add Auth checks
  try {
    const suppliers: Supplier[] = await prisma.supplier.findMany({
      where: { isActive: true }, // Optional: Only active ones
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to get suppliers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
