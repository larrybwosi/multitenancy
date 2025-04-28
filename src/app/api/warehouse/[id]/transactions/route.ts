// src/app/api/warehouse/[id]/transactions/route.ts
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

interface TransactionFilters {
  movementType?: MovementType[];
  productId?: string;
  variantId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  memberId?: string;
  page?: number;
  pageSize?: number;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: TransactionFilters = {
      movementType: searchParams.getAll('movementType') as MovementType[],
      productId: searchParams.get('productId') || undefined,
      variantId: searchParams.get('variantId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      memberId: searchParams.get('memberId') || undefined,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 20,
    };

    // Validate the warehouse ID
    if (!id) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 });
    }

    // Build the WHERE clause for Prisma
    const where: Prisma.StockMovementWhereInput = {
      OR: [{ fromLocationId: id }, { toLocationId: id }],
    };

    // Apply filters
    if (filters.movementType?.length) {
      where.movementType = { in: filters.movementType };
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.variantId) {
      where.variantId = filters.variantId;
    }

    if (filters.memberId) {
      where.memberId = filters.memberId;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.movementDate = {};
      if (filters.dateFrom) {
        where.movementDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.movementDate.lte = new Date(filters.dateTo);
      }
    }

    // Search functionality (searches product name, variant name, or reference)
    if (filters.search) {
      where.OR = [
        ...where.OR, // Keep existing location OR
        {
          product: {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          variant: {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          referenceId: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await db.stockMovement.count({ where });

    // Fetch transactions with pagination
    const transactions = await db.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            attributes: true,
          },
        },
        stockBatch: {
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            locationType: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            locationType: true,
          },
        },
        member: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        movementDate: 'desc',
      },
      skip: (filters?.page - 1) * filters?.pageSize,
      take: filters.pageSize,
    });

    return NextResponse.json({
      data: transactions,
      pagination: {
        total: totalCount,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil(totalCount / filters?.pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse transactions' }, { status: 500 });
  }
}

// Define the MovementType enum to match your Prisma schema
type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER'
  | 'CUSTOMER_RETURN'
  | 'SUPPLIER_RETURN'
  | 'INITIAL_STOCK'
  | 'PRODUCTION_IN'
  | 'PRODUCTION_OUT';
