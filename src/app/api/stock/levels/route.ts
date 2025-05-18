import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/db"
import { Prisma } from "@/prisma/client"
import { getServerAuthContext } from "@/actions/auth"

// Define types for stock levels response
interface WarehouseStockData {
  warehouseId: string
  warehouseName: string
  quantity: number
  minLevel: number
  maxLevel: number
  reorderPoint: number
  reorderQuantity: number
  location: string
  lastCountDate: Date | null
}

interface StockLevelResponse {
  productId: string
  productName: string
  sku: string
  category: string
  imageUrls: string[]
  variantStocks: WarehouseStockData[]
  totalQuantity: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  status: string
}

export async function GET(request: NextRequest) {
  const { organizationId } = await getServerAuthContext();
  try {
    const { searchParams } = request.nextUrl
    const locationId = searchParams.get("warehouseId")
    const search = searchParams.get("search")
    const categoryId = searchParams.get("category")
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = (searchParams.get("sortOrder") || "asc") as Prisma.SortOrder
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Build where clause for filtering products
    const productWhere: Prisma.ProductWhereInput = {organizationId}
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId && categoryId !== "all") {
      productWhere.categoryId = categoryId
    }

    // Get all products with their variant stocks
    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
          // stockBatches: {
          //   select: { currentQuantity: true },
          //   where: { variantId: null, currentQuantity: { gt: 0 } },
          // },
        variants: {
          include: {
            variantStocks: {
              where: locationId && locationId !== "all" ? { locationId } : undefined,
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Get all inventory locations
    const locations = await prisma.inventoryLocation.findMany({
      where: { isActive: true, organizationId },
      select: {
        id: true,
        name: true,
        address: true,
      }
    })

    // Format the response
    const stockLevels: StockLevelResponse[] = products.map(product => {
      // Calculate totals across all variants and locations
      const variantStocksRaw = product.variants.flatMap(v => v.variantStocks)
      
      const variantStocksTotal = variantStocksRaw.reduce(
        (sum: number, vs) => sum + vs.currentStock,
        0
      )
      const totalQuantity = variantStocksTotal

      const variantStocks = locations.map(location => {
        const variantStocksInLocation = variantStocksRaw
          .filter(vs => vs.locationId === location.id)

        const quantity = variantStocksInLocation.reduce(
          (sum: number, vs) => sum + vs.currentStock,
          0
        )

        const minLevel = Math.min(...variantStocksInLocation.map(vs => vs.reorderPoint))
        const maxLevel = Math.max(...variantStocksInLocation.map(vs => vs.reorderQty * 2))
        const reorderPoint = Math.min(...variantStocksInLocation.map(vs => vs.reorderPoint))
        
        return {
          warehouseId: location.id,
          warehouseName: location.name,
          quantity,
          minLevel: isFinite(minLevel) ? minLevel : 0,
          maxLevel: isFinite(maxLevel) ? maxLevel : 0,
          reorderPoint: isFinite(reorderPoint) ? reorderPoint : 0,
          reorderQuantity: reorderPoint,
          location: location.address || "",
          lastCountDate: null
        }
      })
      
      console.log(product.variants?.[0] * totalQuantity);

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category.name,
        imageUrls: product.imageUrls,
        variantStocks,
        totalQuantity,
        unitCost: product.variants?.[0].buyingPrice,
        lastUpdated: product.updatedAt.toISOString(),
        status:
          totalQuantity <= 0
            ? 'out_of_stock'
            : variantStocks.some(vs => vs.quantity > 0 && vs.quantity <= vs.minLevel)
              ? 'low_stock'
              : variantStocks.every(vs => vs.quantity >= vs.maxLevel)
                ? 'overstock'
                : 'normal',
        totalValue: product.variants?.[0].buyingPrice * totalQuantity,
      };
    })

    // Filter by status if requested
    const filteredStockLevels = status && status !== "all"
      ? stockLevels.filter(item => item.status === status)
      : stockLevels

    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: productWhere
    })
    
    return NextResponse.json({
      stockLevels: filteredStockLevels,
      locations,
      categories: await prisma.category.findMany({select:{name:true, description: true, id:true, parentId: true}}),
      pagination: {
        total: totalProducts,
        page,
        limit
      }
    })
  } catch (error) {
    console.error("Error fetching stock levels:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock levels" },
      { status: 500 }
    )
  }
}
