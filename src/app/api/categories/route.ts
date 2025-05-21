import { deleteCategory, getCategoriesWithStats, GetCategoriesWithStatsParams, saveCategory } from "@/actions/category.actions";
import { handleApiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ orgslug: string }> }) {
  const { searchParams } = new URL(request.url);


  const pr: GetCategoriesWithStatsParams = {
    search: searchParams.get('search') || undefined,
    filter: searchParams.get('filter') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10,
  };

  try {
    const result = await getCategoriesWithStats(pr);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await saveCategory(formData);

    if (result.message && result.message.includes("Error")) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const result = await deleteCategory(id);

    if (result.message && result.message.includes("Error")) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}