import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { description, amount } = await request.json();
    if (typeof amount !== "number") {
      return NextResponse.json(
        { error: "Amount must be a number" },
        { status: 400 }
      );
    }
    const transaction = await prisma.transaction.create({
      data: {
        description: description || null,
        amount: new Prisma.Decimal(amount),
        status: "Pending",
      },
    });
    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}