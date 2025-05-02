import { getServerAuthContext } from "@/actions/auth";
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