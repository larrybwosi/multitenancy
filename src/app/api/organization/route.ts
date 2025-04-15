import { createOrganization } from "@/actions/organization";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const org = await createOrganization(body);
    
    return NextResponse.json(org);
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}