import { getServerAuthContext } from "@/actions/auth";
import { getCategoryOptions } from "@/actions/category.actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { organizationId } = await getServerAuthContext();
    const options = await getCategoryOptions(organizationId);
    return NextResponse.json(options);
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: "Failed to fetch category options" },
      { status: 500 }
    );
  }
}
