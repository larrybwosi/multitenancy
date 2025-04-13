import { NextResponse } from "next/server"

// Mock transaction categories
const transactionCategories = {
  income: ["Product Sales", "Services", "Subscriptions", "Investments", "Interest", "Royalties", "Other Income"],
  expense: [
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
  ],
}

// Mock transaction data
const mockTransactions = Array.from({ length: 50 }, (_, i) => {
  const id = `txn_${String(i + 1).padStart(3, "0")}`
  const isIncome = Math.random() > 0.4
  const type = isIncome ? "income" : "expense"
  const categoryList = transactionCategories[type as keyof typeof transactionCategories]
  const category = categoryList[Math.floor(Math.random() * categoryList.length)]

  // Generate a random date within the last 90 days
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 90))

  // Generate a random amount between 100 and 10000
  const amount = Number.parseFloat((Math.random() * 9900 + 100).toFixed(2))

  // Generate a description based on the category
  let description = ""
  if (isIncome) {
    if (category === "Product Sales") {
      description = `Product Sale - Invoice #${Math.floor(Math.random() * 10000)}`
    } else if (category === "Services") {
      description = `Consulting Services - Client #${Math.floor(Math.random() * 1000)}`
    } else if (category === "Subscriptions") {
      description = `Subscription Payment - Customer #${Math.floor(Math.random() * 1000)}`
    } else {
      description = `${category} - Reference #${Math.floor(Math.random() * 10000)}`
    }
  } else {
    if (category === "Salaries") {
      description = `Employee Salary - ${["January", "February", "March", "April", "May"][Math.floor(Math.random() * 5)]}`
    } else if (category === "Rent") {
      description = `Office Rent - ${["January", "February", "March", "April", "May"][Math.floor(Math.random() * 5)]}`
    } else if (category === "Utilities") {
      description = `${["Electricity", "Water", "Gas", "Internet"][Math.floor(Math.random() * 4)]} Bill`
    } else {
      description = `${category} - Invoice #${Math.floor(Math.random() * 10000)}`
    }
  }

  return {
    id,
    description,
    amount,
    type,
    date: date.toISOString().split("T")[0],
    category,
    paymentMethod: ["Cash", "Credit Card", "Bank Transfer", "Check"][Math.floor(Math.random() * 4)],
    status: ["Completed", "Pending", "Failed"][Math.floor(Math.random() * 3)],
    notes: Math.random() > 0.7 ? `Additional notes for transaction ${id}` : "",
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
  }
})

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const type = searchParams.get("type")
  const category = searchParams.get("category")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const search = searchParams.get("search")

  // Filter transactions based on query parameters
  let filteredTransactions = [...mockTransactions]

  if (type) {
    filteredTransactions = filteredTransactions.filter((t) => t.type === type)
  }

  if (category) {
    filteredTransactions = filteredTransactions.filter((t) => t.category === category)
  }

  if (startDate) {
    filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate)
  }

  if (endDate) {
    filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredTransactions = filteredTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.notes.toLowerCase().includes(searchLower),
    )
  }

  // Sort transactions by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Paginate transactions
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Calculate total pages
  const totalTransactions = filteredTransactions.length
  const totalPages = Math.ceil(totalTransactions / limit)

  return NextResponse.json({
    transactions: paginatedTransactions,
    pagination: {
      page,
      limit,
      totalTransactions,
      totalPages,
    },
    categories: transactionCategories,
  })
}

export async function POST(request: Request) {
  const data = await request.json()

  // In a real application, you would validate the data and save it to a database
  // For this mock API, we'll just return the data with an ID
  const newTransaction = {
    id: `txn_${String(mockTransactions.length + 1).padStart(3, "0")}`,
    ...data,
    date: data.date || new Date().toISOString().split("T")[0],
    status: data.status || "Completed",
  }

  return NextResponse.json(newTransaction)
}
