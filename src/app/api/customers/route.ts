import { getServerAuthContext } from "@/actions/auth";
import { saveCustomer } from "@/actions/customers.actions";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { organizationId } = await getServerAuthContext();
  const search = searchParams.get("search") || undefined;
  const where: Prisma.CustomerWhereInput = {
    isActive: true,
    organizationId,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };
  try {
    const customers = await db.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  
      const formData = new FormData();

      // Append all form fields to FormData
      // We only append defined values to avoid sending "undefined" as strings
      if (body.id) formData.append('id', body.id);
      if (body.name) formData.append('name', body.name);
      if (body.email) formData.append('email', body.email);
      if (body.phone) formData.append('phone', body.phone);
      if (body.address) formData.append('address', body.address);
      if (body.notes) formData.append('notes', body.notes);

  try {
    const customer = await saveCustomer(formData)
    console.log("Customer created:", customer);
    if (!customer) {
      return NextResponse.json({ error: "Customer creation failed" }, { status: 500 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}