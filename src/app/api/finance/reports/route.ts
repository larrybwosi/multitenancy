import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get("type") || "profit-loss"
  const period = searchParams.get("period") || "month"
  const startDate = searchParams.get("startDate") || "2023-01-01"
  const endDate = searchParams.get("endDate") || "2023-12-31"

  let reportData = {}

  switch (reportType) {
    case "profit-loss":
      reportData = generateProfitLossReport(period, startDate, endDate)
      break
    case "balance-sheet":
      reportData = generateBalanceSheetReport(endDate)
      break
    case "cash-flow":
      reportData = generateCashFlowReport(period, startDate, endDate)
      break
    case "tax-summary":
      reportData = generateTaxSummaryReport(period, startDate, endDate)
      break
    case "expense-analysis":
      reportData = generateExpenseAnalysisReport(period, startDate, endDate)
      break
    default:
      reportData = { error: "Invalid report type" }
  }

  return NextResponse.json(reportData)
}

function generateProfitLossReport(period: string, startDate: string, endDate: string) {
  const periods = getPeriods(period, startDate, endDate)

  // Generate revenue data
  const revenue = {
    productSales: generateDataSeries(periods, 50000, 10000),
    services: generateDataSeries(periods, 30000, 8000),
    subscriptions: generateDataSeries(periods, 15000, 5000),
    otherIncome: generateDataSeries(periods, 5000, 2000),
  }

  // Generate expense data
  const expenses = {
    salaries: generateDataSeries(periods, 35000, 5000),
    rent: generateDataSeries(periods, 10000, 0),
    utilities: generateDataSeries(periods, 5000, 1000),
    marketing: generateDataSeries(periods, 8000, 3000),
    officeSupplies: generateDataSeries(periods, 3000, 1000),
    software: generateDataSeries(periods, 4000, 1000),
    other: generateDataSeries(periods, 5000, 2000),
  }

  // Calculate totals
  const totals = periods.map((period, i) => {
    const totalRevenue = Object.values(revenue).reduce((sum, series) => sum + series[i].value, 0)
    const totalExpenses = Object.values(expenses).reduce((sum, series) => sum + series[i].value, 0)
    return {
      period: period,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    }
  })

  return {
    periods,
    revenue,
    expenses,
    totals,
  }
}

function generateBalanceSheetReport(date: string) {
  return {
    date,
    assets: {
      currentAssets: {
        cash: 125000,
        accountsReceivable: 75000,
        inventory: 50000,
        prepaidExpenses: 15000,
        otherCurrentAssets: 10000,
        totalCurrentAssets: 275000,
      },
      nonCurrentAssets: {
        propertyPlantEquipment: 350000,
        accumulatedDepreciation: -75000,
        intangibleAssets: 50000,
        investments: 100000,
        otherNonCurrentAssets: 25000,
        totalNonCurrentAssets: 450000,
      },
      totalAssets: 725000,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 45000,
        shortTermDebt: 25000,
        currentPortionOfLongTermDebt: 15000,
        accruedExpenses: 20000,
        deferredRevenue: 10000,
        otherCurrentLiabilities: 5000,
        totalCurrentLiabilities: 120000,
      },
      nonCurrentLiabilities: {
        longTermDebt: 150000,
        deferredTaxLiabilities: 25000,
        otherNonCurrentLiabilities: 10000,
        totalNonCurrentLiabilities: 185000,
      },
      totalLiabilities: 305000,
    },
    equity: {
      commonStock: 100000,
      retainedEarnings: 320000,
      otherEquity: 0,
      totalEquity: 420000,
    },
    totalLiabilitiesAndEquity: 725000,
  }
}

function generateCashFlowReport(period: string, startDate: string, endDate: string) {
  const periods = getPeriods(period, startDate, endDate)

  // Generate operating activities data
  const operatingActivities = {
    netIncome: generateDataSeries(periods, 20000, 5000),
    depreciation: generateDataSeries(periods, 5000, 0),
    accountsReceivable: generateDataSeries(periods, -3000, 2000),
    inventory: generateDataSeries(periods, -2000, 1500),
    accountsPayable: generateDataSeries(periods, 2500, 1500),
    otherOperating: generateDataSeries(periods, 1000, 1000),
  }

  // Generate investing activities data
  const investingActivities = {
    capitalExpenditures: generateDataSeries(periods, -8000, 3000),
    investments: generateDataSeries(periods, -5000, 2000),
    otherInvesting: generateDataSeries(periods, 1000, 1000),
  }

  // Generate financing activities data
  const financingActivities = {
    debtRepayment: generateDataSeries(periods, -5000, 1000),
    dividends: generateDataSeries(periods, -3000, 0),
    stockIssuance: generateDataSeries(periods, 0, 5000),
    otherFinancing: generateDataSeries(periods, 0, 1000),
  }

  // Calculate totals
  const totals = periods.map((period, i) => {
    const totalOperating = Object.values(operatingActivities).reduce((sum, series) => sum + series[i].value, 0)
    const totalInvesting = Object.values(investingActivities).reduce((sum, series) => sum + series[i].value, 0)
    const totalFinancing = Object.values(financingActivities).reduce((sum, series) => sum + series[i].value, 0)
    return {
      period: period,
      totalOperating,
      totalInvesting,
      totalFinancing,
      netCashFlow: totalOperating + totalInvesting + totalFinancing,
    }
  })

  return {
    periods,
    operatingActivities,
    investingActivities,
    financingActivities,
    totals,
  }
}

function generateTaxSummaryReport(period: string, startDate: string, endDate: string) {
  const periods = getPeriods(period, startDate, endDate)

  // Generate tax data
  const taxes = {
    incomeTax: generateDataSeries(periods, 15000, 3000),
    salesTax: generateDataSeries(periods, 8000, 2000),
    payrollTax: generateDataSeries(periods, 12000, 2000),
    propertyTax: generateDataSeries(periods, 5000, 0),
    otherTaxes: generateDataSeries(periods, 2000, 1000),
  }

  // Calculate totals
  const totals = periods.map((period, i) => {
    const totalTaxes = Object.values(taxes).reduce((sum, series) => sum + series[i].value, 0)
    return {
      period: period,
      totalTaxes,
    }
  })

  return {
    periods,
    taxes,
    totals,
  }
}

function generateExpenseAnalysisReport(period: string, startDate: string, endDate: string) {
  const periods = getPeriods(period, startDate, endDate)

  // Generate expense data
  const expenses = {
    salaries: generateDataSeries(periods, 35000, 5000),
    rent: generateDataSeries(periods, 10000, 0),
    utilities: generateDataSeries(periods, 5000, 1000),
    marketing: generateDataSeries(periods, 8000, 3000),
    officeSupplies: generateDataSeries(periods, 3000, 1000),
    software: generateDataSeries(periods, 4000, 1000),
    travel: generateDataSeries(periods, 3000, 1500),
    mealsEntertainment: generateDataSeries(periods, 2000, 1000),
    professionalServices: generateDataSeries(periods, 6000, 2000),
    insurance: generateDataSeries(periods, 4000, 0),
    taxes: generateDataSeries(periods, 7000, 1000),
    other: generateDataSeries(periods, 3000, 1500),
  }

  // Calculate totals
  const totals = periods.map((period, i) => {
    const totalExpenses = Object.values(expenses).reduce((sum, series) => sum + series[i].value, 0)
    return {
      period: period,
      totalExpenses,
    }
  })

  // Calculate expense breakdown
  const expenseBreakdown = Object.entries(expenses)
    .map(([category, series]) => {
      const total = series.reduce((sum, item) => sum + item.value, 0)
      return {
        category,
        total,
        percentage: ((total / totals.reduce((sum, item) => sum + item.totalExpenses, 0)) * 100).toFixed(2) + "%",
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    periods,
    expenses,
    totals,
    expenseBreakdown,
  }
}

function getPeriods(period: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const periods = []

  if (period === "year") {
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()
    for (let year = startYear; year <= endYear; year++) {
      periods.push(year.toString())
    }
  } else if (period === "quarter") {
    const startYear = start.getFullYear()
    const startQuarter = Math.floor(start.getMonth() / 3) + 1
    const endYear = end.getFullYear()
    const endQuarter = Math.floor(end.getMonth() / 3) + 1

    for (let year = startYear; year <= endYear; year++) {
      const firstQuarter = year === startYear ? startQuarter : 1
      const lastQuarter = year === endYear ? endQuarter : 4

      for (let quarter = firstQuarter; quarter <= lastQuarter; quarter++) {
        periods.push(`${year} Q${quarter}`)
      }
    }
  } else if (period === "month") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      periods.push(`${months[month]} ${year}`)

      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  }

  return periods
}

function generateDataSeries(periods: string[], baseValue: number, variance: number) {
  return periods.map((period) => {
    const randomVariance = (Math.random() * 2 - 1) * variance
    return {
      period,
      value: Math.max(0, Math.round(baseValue + randomVariance)),
    }
  })
}
