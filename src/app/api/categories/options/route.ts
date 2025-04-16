import { getCategoryOptions } from "@/actions/category.actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const options = await getCategoryOptions();
    return NextResponse.json(options);
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: "Failed to fetch category options" },
      { status: 500 }
    );
  }
}
