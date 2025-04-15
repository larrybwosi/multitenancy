import { NextResponse } from "next/server"

// Generate inventory data
function generateInventoryData() {
  const months = 12
  const data = []

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      electronics: Math.floor(Math.random() * 500) + 1000,
      furniture: Math.floor(Math.random() * 300) + 500,
      accessories: Math.floor(Math.random() * 800) + 1500,
      clothing: Math.floor(Math.random() * 600) + 1200,
      officesupplies: Math.floor(Math.random() * 400) + 800,
    })
  }

  return data
}

// Generate category data
function generateCategoryData() {
  return [
    { name: "Electronics", value: 1500, color: "#7c3aed" },
    { name: "Furniture", value: 800, color: "#f97316" },
    { name: "Accessories", value: 2300, color: "#eab308" },
    { name: "Clothing", value: 1800, color: "#06b6d4" },
    { name: "Office Supplies", value: 1200, color: "#14b8a6" },
  ]
}

// Generate turnover data
function generateTurnoverData() {
  return [
    {
      name: "Electronics",
      turnover: (4 + Math.random() * 2).toFixed(1),
      daysOnHand: Math.floor(365 / (4 + Math.random() * 2)),
      costOfGoodsSold: 500000 + Math.random() * 200000,
      averageInventory: 120000 + Math.random() * 50000,
    },
    {
      name: "Furniture",
      turnover: (2 + Math.random() * 1).toFixed(1),
      daysOnHand: Math.floor(365 / (2 + Math.random() * 1)),
      costOfGoodsSold: 300000 + Math.random() * 100000,
      averageInventory: 150000 + Math.random() * 50000,
    },
    {
      name: "Accessories",
      turnover: (6 + Math.random() * 3).toFixed(1),
      daysOnHand: Math.floor(365 / (6 + Math.random() * 3)),
      costOfGoodsSold: 400000 + Math.random() * 150000,
      averageInventory: 70000 + Math.random() * 30000,
    },
    {
      name: "Clothing",
      turnover: (5 + Math.random() * 2).toFixed(1),
      daysOnHand: Math.floor(365 / (5 + Math.random() * 2)),
      costOfGoodsSold: 350000 + Math.random() * 120000,
      averageInventory: 80000 + Math.random() * 30000,
    },
    {
      name: "Office Supplies",
      turnover: (7 + Math.random() * 3).toFixed(1),
      daysOnHand: Math.floor(365 / (7 + Math.random() * 3)),
      costOfGoodsSold: 250000 + Math.random() * 100000,
      averageInventory: 40000 + Math.random() * 20000,
    },
  ]
}

// Generate low stock items
function generateLowStockItems() {
  const products = [
    {
      name: "Premium Laptop",
      sku: "EL-001",
      warehouse: "Main Warehouse",
      reorderPoint: 20,
      daysUntilStockout: 5,
      onOrder: 50,
    },
    {
      name: "Wireless Earbuds",
      sku: "EL-023",
      warehouse: "East Distribution",
      reorderPoint: 50,
      daysUntilStockout: 3,
      onOrder: 100,
    },
    {
      name: "Office Chair",
      sku: "FN-105",
      warehouse: "Main Warehouse",
      reorderPoint: 15,
      daysUntilStockout: 7,
      onOrder: 0,
    },
    {
      name: "Standing Desk",
      sku: "FN-108",
      warehouse: "West Distribution",
      reorderPoint: 10,
      daysUntilStockout: 12,
      onOrder: 15,
    },
    {
      name: "Smartphone Case",
      sku: "AC-210",
      warehouse: "Main Warehouse",
      reorderPoint: 60,
      daysUntilStockout: 4,
      onOrder: 150,
    },
    {
      name: "Bluetooth Speaker",
      sku: "EL-045",
      warehouse: "East Distribution",
      reorderPoint: 30,
      daysUntilStockout: 8,
      onOrder: 50,
    },
    {
      name: "Ergonomic Mouse",
      sku: "OS-112",
      warehouse: "Main Warehouse",
      reorderPoint: 40,
      daysUntilStockout: 6,
      onOrder: 0,
    },
    {
      name: "Leather Wallet",
      sku: "AC-305",
      warehouse: "West Distribution",
      reorderPoint: 25,
      daysUntilStockout: 9,
      onOrder: 0,
    },
    {
      name: "Winter Jacket",
      sku: "CL-087",
      warehouse: "East Distribution",
      reorderPoint: 15,
      daysUntilStockout: 14,
      onOrder: 20,
    },
    {
      name: "Smart Watch",
      sku: "EL-078",
      warehouse: "Main Warehouse",
      reorderPoint: 20,
      daysUntilStockout: 2,
      onOrder: 30,
    },
  ]

  // Add random current stock values that are below reorder point
  return products.map((product) => ({
    ...product,
    currentStock: Math.floor(Math.random() * product.reorderPoint),
  }))
}

// Generate warehouse utilization data
function generateWarehouseUtilization() {
  const warehouses = [
    { name: "Main Warehouse", capacity: 10000 },
    { name: "East Distribution", capacity: 7500 },
    { name: "West Distribution", capacity: 8000 },
    { name: "South Storage", capacity: 5000 },
    { name: "North Storage", capacity: 6000 },
  ]

  return warehouses.map((warehouse) => {
    const utilization = 50 + Math.random() * 40 // 50-90% utilization
    const used = Math.floor(warehouse.capacity * (utilization / 100))
    const availableSpace = warehouse.capacity - used

    return {
      ...warehouse,
      used,
      availableSpace,
      utilization: Math.round(utilization),
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get("dateRange") || "last-30-days"
  const dataType = searchParams.get("dataType") || "overview"

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let responseData = {}

  switch (dataType) {
    case "overview":
      const inventoryData = generateInventoryData()
      const categoryData = generateCategoryData()
      const totalInventory = categoryData.reduce((sum, category) => sum + category.value, 0)
      const lowStockItems = generateLowStockItems()

      responseData = {
        inventoryData,
        categoryData,
        summary: {
          totalInventory,
          lowStockItems: lowStockItems.length,
          inventoryValue: 1500000 + Math.random() * 500000,
          inventoryTurnover: (4 + Math.random() * 2).toFixed(1),
        },
      }
      break
    case "turnover":
      responseData = {
        turnoverData: generateTurnoverData(),
      }
      break
    case "lowStock":
      responseData = {
        lowStockItems: generateLowStockItems(),
      }
      break
    case "warehouses":
      responseData = {
        warehouseUtilization: generateWarehouseUtilization(),
      }
      break
    default:
      responseData = {
        inventoryData: generateInventoryData(),
      }
  }

  return NextResponse.json(responseData)
}

// ```ts file="app/api/organization/reports/financial/route.ts"
// import { NextResponse } from "next/server"

// // Generate profit and loss data
// function generateProfitLossData() {
//   const months = 12
//   const data = []

//   for (let i = 0; i &lt; months; i++) {
//     const date = new Date()
//     date.setMonth(date.getMonth() - (months - i - 1))

//     const baseRevenue = 50000 + Math.random() * 30000 + (i * 1000) // Increasing trend
//     const costOfSales = baseRevenue * (0.4 + Math.random() * 0.1)
//     const grossProfit = baseRevenue - costOfSales
//     const operatingExpenses = baseRevenue * (0.2 + Math.random() * 0.05)
//     const netProfit = grossProfit - operatingExpenses

//     data.push({
//       date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
//       revenue: Math.round(baseRevenue),
//       costOfSales: Math.round(costOfSales),
//       grossProfit: Math.round(grossProfit),
//       operatingExpenses: Math.round(operatingExpenses),
//       netProfit: Math.round(netProfit),
//     })
//   }

//   return data
// }

// // Generate cash flow data
// function generateCashFlowData() {
//   const months = 12
//   const data = []

//   for (let i = 0; i &lt; months; i++) {
//     const date = new Date()
//     date.setMonth(date.getMonth() - (months - i - 1))

//     const operatingCashFlow = 30000 + Math.random() * 20000
//     const investingCashFlow = -(10000 + Math.random() * 15000)
//     const financingCashFlow = (Math.random() > 0.7 ? 1 : -1) * (5000 + Math.random() * 10000)
//     const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

//     data.push({
//       date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
//       operatingCashFlow: Math.round(operatingCashFlow),
//       investingCashFlow: Math.round(investingCashFlow),
//       financingCashFlow: Math.round(financingCashFlow),
//       netCashFlow: Math.round(netCashFlow),
//     })
//   }

//   return data
// }

// // Generate balance sheet data
// function generateBalanceSheet() {
//   return {
//     assets: {
//       current: {
//         cashAndEquivalents: 250000 + Math.random() * 50000,
//         accountsReceivable: 180000 + Math.random() * 40000,
//         inventory: 320000 + Math.random() * 60000,
//         prepaidExpenses: 45000 + Math.random() * 15000,
//         otherCurrentAssets: 25000 + Math.random() * 10000,
//       },
//       nonCurrent: {
//         propertyPlantAndEquipment: 850000 + Math.random() * 150000,
//         intangibleAssets: 320000 + Math.random() * 80000,
//         investments: 180000 + Math.random() * 70000,
//         otherNonCurrentAssets: 75000 + Math.random() * 25000,
//       },
//       totalCurrentAssets: 0, // Will be calculated
//       totalNonCurrentAssets: 0, // Will be calculated
//       totalAssets: 0, // Will be calculated
//     },
//     liabilities: {
//       current: {
//         accountsPayable: 120000 + Math.random() * 30000,
//         shortTermDebt: 80000 + Math.random() * 20000,
//         currentPortionOfLongTermDebt: 50000 + Math.random() * 15000,
//         accruedLiabilities: 65000 + Math.random() * 15000,
//         otherCurrentLiabilities: 35000 + Math.random() * 10000,
//       },
//       nonCurrent: {
//         longTermDebt: 450000 + Math.random() * 100000,
//         deferredTaxLiabilities: 85000 + Math.random() * 25000,
//         otherNonCurrentLiabilities: 70000 + Math.random() * 20000,
//       },
//       totalCurrentLiabilities: 0, // Will be calculated
//       totalNonCurrentLiabilities: 0, // Will be calculated
//       totalLiabilities: 0, // Will be calculated
//     },
//     equity: {
//       commonStock: 500000,
//       retainedEarnings: 650000 + Math.random() * 150000,
//       additionalPaidInCapital: 250000,
//       treasuryStock: -100000,
//       accumulatedOtherComprehensiveIncome: 25000 + Math.random() * 15000,
//       totalEquity: 0, // Will be calculated
//     },
//     totalLiabilitiesAndEquity: 0, // Will be calculated
//   }
// }

// // Calculate totals for balance sheet
// function calculateBalanceSheetTotals(balanceSheet: any) {
//   // Calculate current assets total
//   balanceSheet.assets.totalCurrentAssets = Object.values(balanceSheet.assets.current).reduce(
//     (sum: number, value: any) => sum + value,
//     0
//   )

//   // Calculate non-current assets total
//   balanceSheet.assets.totalNonCurrentAssets = Object.values(balanceSheet.assets.nonCurrent).reduce(
//     (sum: number, value: any) => sum + value,
//     0
//   )

//   // Calculate total assets
//   balanceSheet.assets.totalAssets = balanceSheet.assets.totalCurrentAssets + balanceSheet.assets.totalNonCurrentAssets

//   // Calculate current liabilities total
//   balanceSheet.liabilities.totalCurrentLiabilities = Object.values(balanceSheet.liabilities.current).reduce(
//     (sum: number, value: any) => sum + value,
//     0
//   )

//   // Calculate non-current liabilities total
//   balanceSheet.liabilities.totalNonCurrentLiabilities = Object.values(balanceSheet.liabilities.nonCurrent).reduce(
//     (sum: number, value: any) => sum + value,
//     0
//   )

//   // Calculate total liabilities
//   balanceSheet.liabilities.totalLiabilities =
//     balanceSheet.liabilities.totalCurrentLiabilities + balanceSheet.liabilities.totalNonCurrentLiabilities

//   // Calculate total equity
//   balanceSheet.equity.totalEquity = Object.entries(balanceSheet.equity)
//     .filter(([key]) => key !== "totalEquity")
//     .reduce((sum: number, [_, value]: [string, any]) => sum + value, 0)

//   // Calculate total liabilities and equity
//   balanceSheet.totalLiabilitiesAndEquity = balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity

//   return balanceSheet
// }

// // Generate expense breakdown data
// function generateExpenseBreakdown() {
//   return [
//     { name: "Salaries & Benefits", value: 35 + Math.random() * 5 },
//     { name: "Rent & Utilities", value: 15 + Math.random() * 3 },
//     { name: "Marketing", value: 12 + Math.random() * 3 },
//     { name: "Technology", value: 10 + Math.random() * 2 },
//     { name: "Administrative", value: 8 + Math.random() * 2 },
//     { name: "Research & Development", value: 15 + Math.random() * 3 },
//     { name: "Other", value: 5 + Math.random() * 2 },
//   ].map(item => ({ ...item, value: Math.round(item.value) }))
// }

// // Generate financial ratios
// function generateFinancialRatios() {
//   return {
//     profitability: {
//       grossMargin: (40 + Math.random() * 10).toFixed(1) + "%",
//       operatingMargin: (15 + Math.random() * 5).toFixed(1) + "%",
//       netProfitMargin: (10 + Math.random() * 5).toFixed(1) + "%",
//       returnOnAssets: (8 + Math.random() * 4).toFixed(1) + "%",
//       returnOnEquity: (15 + Math.random() * 7).toFixed(1) + "%",
//     },
//     liquidity: {
//       currentRatio: (1.5 + Math.random() * 1).toFixed(2),
//       quickRatio: (1 + Math.random() * 0.8).toFixed(2),
//       cashRatio: (0.5 + Math.random() * 0.5).toFixed(2),
//     },
//     leverage: {
//       debtToEquity: (0.8 + Math.random() * 0.7).toFixed(2),
//       debtToAssets: (0.3 + Math.random() * 0.3).toFixed(2),
//       interestCoverage: (4 + Math.random() * 4).toFixed(2),
//     },
//     efficiency: {
//       assetTurnover: (1.2 + Math.random() * 0.6).toFixed(2),
//       inventoryTurnover: (4 + Math.random() * 2).toFixed(2),
//       receivablesTurnover: (8 + Math.random() * 4).toFixed(2),
//     },
//   }
// }

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url)
//   const dateRange = searchParams.get("dateRange") || "last-30-days"
//   const dataType = searchParams.get("dataType") || "profitLoss"

//   // Simulate API delay
//   await new Promise((resolve) => setTimeout(resolve, 500))

//   let responseData = {}

//   switch (dataType) {
//     case "profitLoss":
//       const profitLossData = generateProfitLossData()
//       const latestMonth = profitLossData[profitLossData.length - 1]
//       const previousMonth = profitLossData[profitLossData.length - 2]

//       responseData = {
//         profitLossData,
//         summary: {
//           revenue: latestMonth.revenue,
//           netProfit: latestMonth.netProfit,
//           grossMargin: ((latestMonth.grossProfit / latestMonth.revenue) * 100).toFixed(1) + "%",
//           netMargin: ((latestMonth.netProfit / latestMonth.revenue) * 100).toFixed(1) + "%",
//           revenueGrowth: ((latestMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1) + "%",
//           profitGrowth: ((latestMonth.netProfit - previousMonth.netProfit) / previousMonth.netProfit * 100).toFixed(1) + "%",
//         },
//       }
//       break
//     case "cashFlow":
//       responseData = {
//         cashFlowData: generateCashFlowData(),
//       }
//       break
//     case "balanceSheet":
//       responseData = {
//         balanceSheet: calculateBalanceSheetTotals(generateBalanceSheet()),
//       }
//       break
//     case "expenses":
//       responseData = {
//         expenseBreakdown: generateExpenseBreakdown(),
//       }
//       break
//     case "ratios":
//       responseData = {
//         financialRatios: generateFinancialRatios(),
//       }
//       break
//     default:
//       responseData = {
//         profitLossData: generateProfitLossData(),
//       }
//   }

//   return NextResponse.json(responseData)
// }
