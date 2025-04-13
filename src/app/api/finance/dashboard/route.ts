import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "month"

  // Mock financial dashboard data
  const dashboardData = {
    summary: {
      totalRevenue: 125750.45,
      totalExpenses: 78320.89,
      netProfit: 47429.56,
      cashOnHand: 89650.32,
      accountsReceivable: 32450.75,
      accountsPayable: 18750.45,
    },
    revenueByCategory: [
      { category: "Product Sales", amount: 85320.45 },
      { category: "Services", amount: 32450.75 },
      { category: "Subscriptions", amount: 7980.25 },
    ],
    expensesByCategory: [
      { category: "Salaries", amount: 42350.75 },
      { category: "Rent", amount: 12500.0 },
      { category: "Utilities", amount: 3750.45 },
      { category: "Marketing", amount: 8750.25 },
      { category: "Office Supplies", amount: 2450.89 },
      { category: "Software", amount: 5320.55 },
      { category: "Other", amount: 3200.0 },
    ],
    cashFlow: generateCashFlowData(period),
    profitLoss: generateProfitLossData(period),
    upcomingPayments: [
      { id: "pay_001", description: "Office Rent", amount: 4500.0, dueDate: "2023-05-15" },
      { id: "pay_002", description: "Internet Service", amount: 250.0, dueDate: "2023-05-18" },
      { id: "pay_003", description: "Software Subscription", amount: 750.0, dueDate: "2023-05-20" },
      { id: "pay_004", description: "Utility Bill", amount: 320.45, dueDate: "2023-05-25" },
    ],
    recentTransactions: [
      {
        id: "txn_001",
        description: "Product Sale - Invoice #1234",
        amount: 1250.0,
        type: "income",
        date: "2023-05-01",
        category: "Product Sales",
      },
      {
        id: "txn_002",
        description: "Office Supplies",
        amount: 450.75,
        type: "expense",
        date: "2023-05-02",
        category: "Office Supplies",
      },
      {
        id: "txn_003",
        description: "Consulting Services",
        amount: 3500.0,
        type: "income",
        date: "2023-05-03",
        category: "Services",
      },
      {
        id: "txn_004",
        description: "Employee Salary",
        amount: 5250.0,
        type: "expense",
        date: "2023-05-04",
        category: "Salaries",
      },
      {
        id: "txn_005",
        description: "Software Subscription",
        amount: 750.0,
        type: "expense",
        date: "2023-05-05",
        category: "Software",
      },
    ],
  }

  return NextResponse.json(dashboardData)
}

function generateCashFlowData(period: string) {
  const periods = period === "year" ? 12 : period === "quarter" ? 3 : 30
  const data = []

  const cashIn = 85000
  const cashOut = 65000

  for (let i = 0; i < periods; i++) {
    const date =
      period === "year"
        ? `${2023}-${String(i + 1).padStart(2, "0")}`
        : period === "quarter"
          ? `Q${i + 1}`
          : `Day ${i + 1}`

    // Add some randomness to the data
    const cashInVariation = Math.random() * 10000 - 5000
    const cashOutVariation = Math.random() * 8000 - 4000

    const periodCashIn = Math.max(0, cashIn + cashInVariation)
    const periodCashOut = Math.max(0, cashOut + cashOutVariation)

    data.push({
      date,
      cashIn: periodCashIn,
      cashOut: periodCashOut,
      netCash: periodCashIn - periodCashOut,
    })
  }

  return data
}

function generateProfitLossData(period: string) {
  const periods = period === "year" ? 12 : period === "quarter" ? 3 : 30
  const data = []

  const revenue = 95000
  const expenses = 75000

  for (let i = 0; i < periods; i++) {
    const date =
      period === "year"
        ? `${2023}-${String(i + 1).padStart(2, "0")}`
        : period === "quarter"
          ? `Q${i + 1}`
          : `Day ${i + 1}`

    // Add some randomness to the data
    const revenueVariation = Math.random() * 15000 - 7500
    const expensesVariation = Math.random() * 10000 - 5000

    const periodRevenue = Math.max(0, revenue + revenueVariation)
    const periodExpenses = Math.max(0, expenses + expensesVariation)

    data.push({
      date,
      revenue: periodRevenue,
      expenses: periodExpenses,
      profit: periodRevenue - periodExpenses,
    })
  }

  return data
}
