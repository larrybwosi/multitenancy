import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listProducts } from "@/actions/products";
import { ProductColumn } from "@/components/products/columns";
import { ProductClient } from "@/components/products/product-client";

interface ProductsPageProps {
  params: { organizationSlug: string };
  searchParams: {
    // Access search params for server-side filtering/pagination if needed
    page?: string;
    pageSize?: string;
    // Add other potential search params like categoryId, status, searchTerm
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  // --- Authentication and Authorization ---
  const session = await auth.api.getSession({ headers: await headers() });
  console.log(session)
  const organizationId = session?.session.activeOrganizationId;
  const userId = session?.session.userId;
  if (!userId || !organizationId) {
    redirect("/login");
  };


  // TODO: Add authorization check: Ensure userId is part of this organizationId
  // This check might live in middleware or be repeated here/in actions

  // --- Fetch Categories (for filtering/form dropdown) ---
  const categories = await db.category.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // --- Fetch Initial Product Data ---
  // Example: Read pagination from searchParams, default if not present
  const page = parseInt(searchParams.page ?? "1", 10);
  const pageSize = parseInt(searchParams.pageSize ?? "10", 10);

  // TODO: Add server-side filtering based on searchParams if desired for initial load
  const result = await listProducts({
    page,
    pageSize,
    includeCategory: true, // Fetch category name
    // Pass other filters from searchParams here if needed
  });

  if (!result.success || !result.data) {
    // Handle error fetching products (e.g., show an error message)
    console.error("Failed to fetch products:", result.error);
    return <div>Error loading products. Please try again later.</div>;
  }

  // --- Data Transformation ---
  // Transform the fetched data (which includes relations) into the flat ProductColumn structure
  // required by the TanStack Table columns definition.
  const formattedProducts: ProductColumn[] = result.data.products.map(
    (product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      // Access nested category name safely
      categoryName: product.category?.name ?? null,
      currentSellingPrice: product.currentSellingPrice, // Keep as Decimal
      isActive: product.isActive,
      // Access nested stock sum safely, ensure it's Decimal or null/undefined
      stockQuantity:
        product._sum?.stockQuantity
          ? product._sum.stockQuantity
          : product._sum?.stockQuantity
            ? product._sum.stockQuantity
            : null,
      unit: product.unit,
    })
  );

  return (
    <ProductClient
      initialProducts={formattedProducts}
      totalCount={result.data.totalCount}
      organizationSlug={params.organizationSlug}
      organizationId={organizationId}
      categories={categories}
      // Pass initial pagination state if needed by ProductClient
    />
  );
}
