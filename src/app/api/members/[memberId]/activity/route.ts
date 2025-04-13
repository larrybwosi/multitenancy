import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerAuthContext } from "@/actions/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
  const { organizationId } = await getServerAuthContext();
  

    const { memberId } = await params
    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get("limit") || "5")
    
    // Validate member exists and belongs to user's organization
    const member = await db.member.findUnique({
      where: {
        id: memberId,
        organizationId
      }
    })
    
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
    
    // Get recent sales
    const recentSales = await db.sale.findMany({
      where: {
        memberId: member.userId,
        organizationId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        saleDate: "desc"
      },
      take: limit
    })
    
    // Get audit logs for this member
    const auditLogs = await db.auditLog.findMany({
      where: {
        memberId: member.userId,
        organizationId

      },
      orderBy: {
        performedAt: "desc"
      },
      take: limit
    })
    
    // Get summary statistics
    const salesStats = await db.sale.aggregate({
      where: {
        memberId,
        organizationId
      },
      _count: {
        id: true
      },
      _sum: {
        finalAmount: true
      }
    })
    
    // Calculate average sale value
    const averageSaleValue = salesStats._sum?.finalAmount && salesStats?._count?.id
      ? salesStats._sum.finalAmount.toNumber() / salesStats._count.id
      : 0
    
    // Get item count from sales
    const itemStats = await db.saleItem.aggregate({
      where: {
        sale: {
          memberId,
          organizationId
        }
      },
      _sum: {
        quantity: true
      }
    })
    
    const statistics = {
      totalSales: salesStats?._count?.id || 0,
      totalRevenue: salesStats?._sum?.finalAmount?.toNumber() || 0,
      averageSaleValue,
      totalItemsSold: itemStats._sum?.quantity || 0
    }
    
    return NextResponse.json({
      recentSales,
      auditLogs,
      statistics
    })
  } catch (error) {
    console.error("Error fetching member activity:", error)
    return NextResponse.json({ error: "Failed to fetch member activity" }, { status: 500 })
  }
} 