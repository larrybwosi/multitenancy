import { NextResponse } from "next/server"

// Mock tax rates
const taxRates = {
  incomeTax: {
    brackets: [
      { min: 0, max: 50000, rate: 0.15 },
      { min: 50001, max: 100000, rate: 0.25 },
      { min: 100001, max: 250000, rate: 0.3 },
      { min: 250001, max: Number.POSITIVE_INFINITY, rate: 0.35 },
    ],
    deductions: [
      { name: "Business Expenses", amount: 25000 },
      { name: "Depreciation", amount: 15000 },
      { name: "Retirement Contributions", amount: 10000 },
    ],
  },
  salesTax: {
    standard: 0.08,
    reduced: 0.05,
    exempt: 0.0,
  },
  payrollTax: {
    socialSecurity: 0.062,
    medicare: 0.0145,
    federalUnemployment: 0.006,
    stateUnemployment: 0.027,
  },
}

// Mock tax records
const mockTaxRecords = Array.from({ length: 20 }, (_, i) => {
  const id = `tax_${String(i + 1).padStart(3, "0")}`

  // Generate a random date within the last 2 years
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 730))

  // Generate a random tax type
  const taxTypes = ["Income Tax", "Sales Tax", "Payroll Tax", "Property Tax"]
  const taxType = taxTypes[Math.floor(Math.random() * taxTypes.length)]

  // Generate a random period
  const periods = ["Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022", "Q1 2023", "Q2 2023"]
  const period = periods[Math.floor(Math.random() * periods.length)]

  // Generate a random amount between 1000 and 50000
  const amount = Number.parseFloat((Math.random() * 49000 + 1000).toFixed(2))

  return {
    id,
    taxType,
    period,
    dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    amount,
    status: ["Paid", "Pending", "Overdue"][Math.floor(Math.random() * 3)],
    filingDate: Math.random() > 0.3 ? date.toISOString().split("T")[0] : null,
    notes: Math.random() > 0.7 ? `Additional notes for tax record ${id}` : "",
    attachments:
      Math.random() > 0.8
        ? [
            {
              id: `att_${i}`,
              name: `tax-document-${i}.pdf`,
              url: `https://example.com/tax-documents/tax-document-${i}.pdf`,
              size: `${Math.floor(Math.random() * 1000) + 100}KB`,
            },
          ]
        : [],
  }
})

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const taxType = searchParams.get("taxType")
  const period = searchParams.get("period")
  const status = searchParams.get("status")

  // Filter tax records based on query parameters
  let filteredRecords = [...mockTaxRecords]

  if (taxType) {
    filteredRecords = filteredRecords.filter((r) => r.taxType === taxType)
  }

  if (period) {
    filteredRecords = filteredRecords.filter((r) => r.period === period)
  }

  if (status) {
    filteredRecords = filteredRecords.filter((r) => r.status === status)
  }

  // Sort tax records by due date (newest first)
  filteredRecords.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  // Paginate tax records
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  // Calculate total pages
  const totalRecords = filteredRecords.length
  const totalPages = Math.ceil(totalRecords / limit)

  return NextResponse.json({
    taxRecords: paginatedRecords,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
    taxRates,
    taxTypes: ["Income Tax", "Sales Tax", "Payroll Tax", "Property Tax"],
    periods: ["Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022", "Q1 2023", "Q2 2023"],
  })
}

export async function POST(request: Request) {
  const data = await request.json()

  // In a real application, you would validate the data and save it to a database
  // For this mock API, we'll just return the data with an ID
  const newTaxRecord = {
    id: `tax_${String(mockTaxRecords.length + 1).padStart(3, "0")}`,
    ...data,
    status: data.status || "Pending",
  }

  return NextResponse.json(newTaxRecord)
}
