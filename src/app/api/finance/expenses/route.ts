import { NextResponse } from "next/server"

// Mock expense categories
const expenseCategories = [
  "Salaries",
  "Rent",
  "Utilities",
  "Marketing",
  "Office Supplies",
  "Software",
  "Travel",
  "Meals & Entertainment",
  "Professional Services",
  "Insurance",
  "Taxes",
  "Other Expenses",
]

// Mock expense data
const mockExpenses = Array.from({ length: 40 }, (_, i) => {
  const id = `exp_${String(i + 1).padStart(3, "0")}`
  const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)]

  // Generate a random date within the last 90 days
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 90))

  // Generate a random amount between 50 and 5000
  const amount = Number.parseFloat((Math.random() * 4950 + 50).toFixed(2))

  // Generate a description based on the category
  let description = ""
  if (category === "Salaries") {
    description = `Employee Salary - ${["January", "February", "March", "April", "May"][Math.floor(Math.random() * 5)]}`
  } else if (category === "Rent") {
    description = `Office Rent - ${["January", "February", "March", "April", "May"][Math.floor(Math.random() * 5)]}`
  } else if (category === "Utilities") {
    description = `${["Electricity", "Water", "Gas", "Internet"][Math.floor(Math.random() * 4)]} Bill`
  } else if (category === "Software") {
    description = `${["CRM", "Accounting", "Design", "Project Management"][Math.floor(Math.random() * 4)]} Software Subscription`
  } else {
    description = `${category} - Invoice #${Math.floor(Math.random() * 10000)}`
  }

  // Determine if it's a recurring expense
  const isRecurring = Math.random() > 0.7

  return {
    id,
    description,
    amount,
    date: date.toISOString().split("T")[0],
    category,
    paymentMethod: ["Cash", "Credit Card", "Bank Transfer", "Check"][Math.floor(Math.random() * 4)],
    status: ["Paid", "Pending", "Overdue"][Math.floor(Math.random() * 3)],
    notes: Math.random() > 0.7 ? `Additional notes for expense ${id}` : "",
    attachments:
      Math.random() > 0.8
        ? [
            {
              id: `att_${i}`,
              name: `receipt-${i}.pdf`,
              url: `https://example.com/receipts/receipt-${i}.pdf`,
              size: `${Math.floor(Math.random() * 1000) + 100}KB`,
            },
          ]
        : [],
    vendor: `Vendor ${Math.floor(Math.random() * 20) + 1}`,
    isRecurring,
    recurringDetails: isRecurring
      ? {
          frequency: ["Monthly", "Quarterly", "Annually"][Math.floor(Math.random() * 3)],
          nextDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          endDate:
            Math.random() > 0.5
              ? new Date(date.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
              : null,
        }
      : null,
  }
})

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const category = searchParams.get("category")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const search = searchParams.get("search")
  const isRecurring = searchParams.get("isRecurring")

  // Filter expenses based on query parameters
  let filteredExpenses = [...mockExpenses]

  if (category) {
    filteredExpenses = filteredExpenses.filter((e) => e.category === category)
  }

  if (startDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date >= startDate)
  }

  if (endDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredExpenses = filteredExpenses.filter(
      (e) =>
        e.description.toLowerCase().includes(searchLower) ||
        e.category.toLowerCase().includes(searchLower) ||
        e.vendor.toLowerCase().includes(searchLower) ||
        e.notes.toLowerCase().includes(searchLower),
    )
  }

  if (isRecurring === "true") {
    filteredExpenses = filteredExpenses.filter((e) => e.isRecurring)
  } else if (isRecurring === "false") {
    filteredExpenses = filteredExpenses.filter((e) => !e.isRecurring)
  }

  // Sort expenses by date (newest first)
  filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Paginate expenses
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  // Calculate total pages
  const totalExpenses = filteredExpenses.length
  const totalPages = Math.ceil(totalExpenses / limit)

  return NextResponse.json({
    expenses: paginatedExpenses,
    pagination: {
      page,
      limit,
      totalExpenses,
      totalPages,
    },
    categories: expenseCategories,
  })
}

export async function POST(request: Request) {
  const data = await request.json()

  // In a real application, you would validate the data and save it to a database
  // For this mock API, we'll just return the data with an ID
  const newExpense = {
    id: `exp_${String(mockExpenses.length + 1).padStart(3, "0")}`,
    ...data,
    date: data.date || new Date().toISOString().split("T")[0],
    status: data.status || "Pending",
  }

  return NextResponse.json(newExpense)
}
