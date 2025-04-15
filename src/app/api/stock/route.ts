import { NextResponse } from "next/server"

// Enhanced mock data for inventory adjustments with more detailed information
const mockInventoryAdjustments = [
  {
    id: "adj_001",
    date: "2023-04-15T11:30:00Z",
    warehouseId: "wh_001",
    warehouseName: "Main Warehouse",
    adjustmentType: "count",
    status: "approved",
    items: [
      {
        productId: "prod_001",
        productName: "Office Chair - Ergonomic",
        sku: "OC-ERG-001",
        previousQuantity: 42,
        newQuantity: 45,
        difference: 3,
        unitCost: 120.0,
        totalCost: 360.0,
        image: "/placeholder.svg?height=40&width=40",
      },
      {
        productId: "prod_003",
        productName: "Desk Lamp - LED",
        sku: "DL-LED-003",
        previousQuantity: 65,
        newQuantity: 60,
        difference: -5,
        unitCost: 35.5,
        totalCost: -177.5,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
    reason: "Physical inventory count",
    notes: "Quarterly inventory audit",
    createdBy: "John Doe",
    createdById: "user_001",
    createdAt: "2023-04-15T11:30:00Z",
    approvedBy: "Jane Smith",
    approvedById: "user_002",
    approvedAt: "2023-04-15T13:45:00Z",
    totalItems: 2,
    totalDifference: -2,
    totalCostImpact: 182.5,
    referenceNumber: "INV-COUNT-Q2-2023",
    documentUrl: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "adj_002",
    date: "2023-04-18T09:15:00Z",
    warehouseId: "wh_002",
    warehouseName: "East Branch Warehouse",
    adjustmentType: "damage",
    status: "approved",
    items: [
      {
        productId: "prod_005",
        productName: "Wireless Keyboard",
        sku: "WK-001",
        previousQuantity: 20,
        newQuantity: 18,
        difference: -2,
        unitCost: 65.25,
        totalCost: -130.5,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
    reason: "Damaged goods",
    notes: "Water damage from roof leak",
    createdBy: "Robert Johnson",
    createdById: "user_003",
    createdAt: "2023-04-18T09:15:00Z",
    approvedBy: "Jane Smith",
    approvedById: "user_002",
    approvedAt: "2023-04-18T10:30:00Z",
    totalItems: 1,
    totalDifference: -2,
    totalCostImpact: -130.5,
    referenceNumber: "DMG-2023-042",
    documentUrl: "/placeholder.svg?height=100&width=100",
    damageDetails: "Water damage from roof leak during storm",
    insuranceClaim: true,
    insuranceClaimNumber: "INS-2023-0456",
  },
  {
    id: "adj_003",
    date: "2023-04-20T14:45:00Z",
    warehouseId: "wh_003",
    warehouseName: "West Branch Warehouse",
    adjustmentType: "theft",
    status: "approved",
    items: [
      {
        productId: "prod_006",
        productName: "Wireless Mouse",
        sku: "WM-001",
        previousQuantity: 18,
        newQuantity: 15,
        difference: -3,
        unitCost: 45.0,
        totalCost: -135.0,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
    reason: "Theft",
    notes: "Reported to security",
    createdBy: "Emily Davis",
    createdById: "user_004",
    createdAt: "2023-04-20T14:45:00Z",
    approvedBy: "John Doe",
    approvedById: "user_001",
    approvedAt: "2023-04-20T16:20:00Z",
    totalItems: 1,
    totalDifference: -3,
    totalCostImpact: -135.0,
    referenceNumber: "THEFT-2023-007",
    documentUrl: "/placeholder.svg?height=100&width=100",
    securityReport: "SR-2023-042",
    policeReport: "PR-2023-1234",
  },
  {
    id: "adj_004",
    date: "2023-04-22T10:10:00Z",
    warehouseId: "wh_001",
    warehouseName: "Main Warehouse",
    adjustmentType: "return",
    status: "pending",
    items: [
      {
        productId: "prod_002",
        productName: "Standing Desk - Adjustable",
        sku: "SD-ADJ-002",
        previousQuantity: 20,
        newQuantity: 22,
        difference: 2,
        unitCost: 250.0,
        totalCost: 500.0,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
    reason: "Customer return",
    notes: "Returned due to wrong color",
    createdBy: "Michael Wilson",
    createdById: "user_005",
    createdAt: "2023-04-22T10:10:00Z",
    totalItems: 1,
    totalDifference: 2,
    totalCostImpact: 500.0,
    referenceNumber: "RET-2023-089",
    documentUrl: "/placeholder.svg?height=100&width=100",
    returnAuthorizationNumber: "RA-2023-1234",
    customerName: "Acme Corp",
    customerOrderNumber: "ORD-2023-5678",
  },
  {
    id: "adj_005",
    date: "2023-04-24T15:30:00Z",
    warehouseId: "wh_002",
    warehouseName: "East Branch Warehouse",
    adjustmentType: "count",
    status: "rejected",
    items: [
      {
        productId: "prod_004",
        productName: "Monitor Stand",
        sku: "MS-001",
        previousQuantity: 12,
        newQuantity: 18,
        difference: 6,
        unitCost: 45.75,
        totalCost: 274.5,
        image: "/placeholder.svg?height=40&width=40",
      },
    ],
    reason: "Physical inventory count",
    notes: "Discrepancy too large, recount needed",
    createdBy: "Robert Johnson",
    createdById: "user_003",
    createdAt: "2023-04-24T15:30:00Z",
    rejectedBy: "Jane Smith",
    rejectedById: "user_002",
    rejectedAt: "2023-04-24T16:45:00Z",
    rejectionReason: "Variance exceeds allowable threshold, please recount",
    totalItems: 1,
    totalDifference: 6,
    totalCostImpact: 274.5,
    referenceNumber: "INV-COUNT-EB-2023-04",
    documentUrl: "/placeholder.svg?height=100&width=100",
  },
]

// Mock warehouse data for reference
const mockWarehouses = [
  { id: "wh_001", name: "Main Warehouse", location: "Headquarters" },
  { id: "wh_002", name: "East Branch Warehouse", location: "East City" },
  { id: "wh_003", name: "West Branch Warehouse", location: "West City" },
]

// Mock product data for reference
const mockProducts = [
  { id: "prod_001", name: "Office Chair - Ergonomic", sku: "OC-ERG-001", unitCost: 120.0, category: "Furniture" },
  { id: "prod_002", name: "Standing Desk - Adjustable", sku: "SD-ADJ-002", unitCost: 250.0, category: "Furniture" },
  { id: "prod_003", name: "Desk Lamp - LED", sku: "DL-LED-003", unitCost: 35.5, category: "Lighting" },
  { id: "prod_004", name: "Monitor Stand", sku: "MS-001", unitCost: 45.75, category: "Accessories" },
  { id: "prod_005", name: "Wireless Keyboard", sku: "WK-001", unitCost: 65.25, category: "Electronics" },
  { id: "prod_006", name: "Wireless Mouse", sku: "WM-001", unitCost: 45.0, category: "Electronics" },
  { id: "prod_007", name: "Laptop Stand", sku: "LS-001", unitCost: 35.5, category: "Accessories" },
  { id: "prod_008", name: "Desk Organizer", sku: "DO-001", unitCost: 25.75, category: "Office Supplies" },
]

export async function GET(request: Request) {
  // Get URL parameters
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const warehouseId = searchParams.get("warehouseId")
  const adjustmentType = searchParams.get("adjustmentType")
  const search = searchParams.get("search")
  const sortBy = searchParams.get("sortBy") || "date"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  // Filter adjustments based on parameters
  let filteredAdjustments = [...mockInventoryAdjustments]

  if (status && status !== "all") {
    filteredAdjustments = filteredAdjustments.filter((adjustment) => adjustment.status === status)
  }

  if (warehouseId && warehouseId !== "all") {
    filteredAdjustments = filteredAdjustments.filter((adjustment) => adjustment.warehouseId === warehouseId)
  }

  if (adjustmentType && adjustmentType !== "all") {
    filteredAdjustments = filteredAdjustments.filter((adjustment) => adjustment.adjustmentType === adjustmentType)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredAdjustments = filteredAdjustments.filter(
      (adjustment) =>
        adjustment.id.toLowerCase().includes(searchLower) ||
        adjustment.warehouseName.toLowerCase().includes(searchLower) ||
        adjustment.reason.toLowerCase().includes(searchLower) ||
        adjustment.referenceNumber.toLowerCase().includes(searchLower) ||
        adjustment.items.some(
          (item) =>
            item.productName.toLowerCase().includes(searchLower) || item.sku.toLowerCase().includes(searchLower),
        ),
    )
  }

  // Sort adjustments
  filteredAdjustments.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "date":
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
        break
      case "warehouseName":
        comparison = a.warehouseName.localeCompare(b.warehouseName)
        break
      case "adjustmentType":
        comparison = a.adjustmentType.localeCompare(b.adjustmentType)
        break
      case "totalCostImpact":
        comparison = Math.abs(b.totalCostImpact) - Math.abs(a.totalCostImpact)
        break
      case "totalDifference":
        comparison = Math.abs(b.totalDifference) - Math.abs(a.totalDifference)
        break
      default:
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
    }

    return sortOrder === "asc" ? -comparison : comparison
  })

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    adjustments: filteredAdjustments,
    warehouses: mockWarehouses,
    products: mockProducts,
    total: filteredAdjustments.length,
  })
}

export async function POST(request: Request) {
  const data = await request.json()

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Calculate totals
  const totalItems = data.items.length
  const totalDifference = data.items.reduce((sum, item) => sum + (item.newQuantity - item.previousQuantity), 0)
  const totalCostImpact = data.items.reduce((sum, item) => {
    const difference = item.newQuantity - item.previousQuantity
    return sum + difference * item.unitCost
  }, 0)

  // Get warehouse name
  const warehouseName = mockWarehouses.find((w) => w.id === data.warehouseId)?.name || "Unknown Warehouse"

  // Generate a reference number based on adjustment type
  let referenceNumber = ""
  switch (data.adjustmentType) {
    case "count":
      referenceNumber = `INV-COUNT-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
      break
    case "damage":
      referenceNumber = `DMG-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
      break
    case "theft":
      referenceNumber = `THEFT-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
      break
    case "return":
      referenceNumber = `RET-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
      break
    default:
      referenceNumber = `ADJ-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
  }

  // In a real application, you would save this data to a database
  const newAdjustment = {
    id: `adj_${Date.now()}`,
    date: new Date().toISOString(),
    status: "pending",
    ...data,
    warehouseName,
    createdBy: "Current User",
    createdById: "current_user_id",
    createdAt: new Date().toISOString(),
    totalItems,
    totalDifference,
    totalCostImpact,
    referenceNumber,
    documentUrl: "/placeholder.svg?height=100&width=100",
  }

  return NextResponse.json({
    success: true,
    adjustment: newAdjustment,
  })
}

export async function PUT(request: Request) {
  const data = await request.json()
  const { id, action } = data

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Find the adjustment to update
  const adjustmentIndex = mockInventoryAdjustments.findIndex((a) => a.id === id)

  if (adjustmentIndex === -1) {
    return NextResponse.json({ success: false, message: "Adjustment not found" }, { status: 404 })
  }

  const adjustment = { ...mockInventoryAdjustments[adjustmentIndex] }
  const now = new Date().toISOString()

  // Update the adjustment based on the action
  switch (action) {
    case "approve":
      adjustment.status = "approved"
      adjustment.approvedAt = now
      adjustment.approvedBy = "Current User"
      adjustment.approvedById = "current_user_id"
      break
    case "reject":
      adjustment.status = "rejected"
      adjustment.rejectedAt = now
      adjustment.rejectedBy = "Current User"
      adjustment.rejectedById = "current_user_id"
      adjustment.rejectionReason = data.rejectionReason || "No reason provided"
      break
    default:
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
  }

  // In a real application, you would update this in the database
  // For now, we'll just return the updated adjustment
  return NextResponse.json({
    success: true,
    adjustment,
  })
}
