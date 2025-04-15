import { NextResponse } from "next/server"

// Generate sales data
function generateSalesData() {
  const months = 12
  const data = []

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))

    const baseRevenue = 50000 + Math.random() * 30000
    const costOfSales = baseRevenue * (0.4 + Math.random() * 0.1)
    const grossProfit = baseRevenue - costOfSales
    const operatingExpenses = baseRevenue * (0.2 + Math.random() * 0.05)
    const netProfit = grossProfit - operatingExpenses
    const orders = Math.floor(baseRevenue / (100 + Math.random() * 50))

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      revenue: Math.round(baseRevenue),
      costOfSales: Math.round(costOfSales),
      grossProfit: Math.round(grossProfit),
      operatingExpenses: Math.round(operatingExpenses),
      netProfit: Math.round(netProfit),
      orders,
    })
  }

  return data
}

// Generate top selling products data
function generateTopSellingProducts() {
  const products = [
    { name: "Premium Laptop", category: "Electronics", price: 1299, sales: 120, growth: "8.5" },
    { name: "Wireless Earbuds", category: "Electronics", price: 129, sales: 350, growth: "12.3" },
    { name: "Office Chair", category: "Furniture", price: 249, sales: 85, growth: "5.2" },
    { name: "Standing Desk", category: "Furniture", price: 499, sales: 65, growth: "-2.1" },
    { name: "Smartphone Case", category: "Accessories", price: 29, sales: 420, growth: "15.7" },
    { name: "Bluetooth Speaker", category: "Electronics", price: 79, sales: 210, growth: "9.8" },
    { name: "Ergonomic Mouse", category: "Office Supplies", price: 59, sales: 180, growth: "3.5" },
    { name: "Leather Wallet", category: "Accessories", price: 49, sales: 150, growth: "-1.2" },
    { name: "Winter Jacket", category: "Clothing", price: 199, sales: 95, growth: "7.4" },
    { name: "Smart Watch", category: "Electronics", price: 299, sales: 110, growth: "10.9" },
  ]

  // Calculate revenue for each product
  return products.map((product) => ({
    ...product,
    revenue: product.price * product.sales,
  }))
}

// Generate sales by channel data
function generateSalesByChannel() {
  return [
    { name: "Online Store", value: 45 },
    { name: "Marketplace", value: 30 },
    { name: "Social Media", value: 15 },
    { name: "Retail", value: 8 },
    { name: "Other", value: 2 },
  ]
}

// Generate sales by region data
function generateSalesByRegion() {
  return [
    { name: "North America", value: 40 },
    { name: "Europe", value: 25 },
    { name: "Asia Pacific", value: 20 },
    { name: "Latin America", value: 10 },
    { name: "Middle East & Africa", value: 5 },
  ]
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
      const salesData = generateSalesData()
      const latestMonth = salesData[salesData.length - 1]
      const previousMonth = salesData[salesData.length - 2]

      responseData = {
        salesData,
        summary: {
          totalRevenue: latestMonth.revenue,
          totalOrders: latestMonth.orders,
          totalProfit: latestMonth.netProfit,
          averageOrderValue: Math.round(latestMonth.revenue / latestMonth.orders),
          conversionRate: 3.2 + Math.random() * 1.5,
          revenueGrowth:
            (((latestMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100).toFixed(1) + "%",
          profitGrowth:
            (((latestMonth.netProfit - previousMonth.netProfit) / previousMonth.netProfit) * 100).toFixed(1) + "%",
        },
      }
      break
    case "products":
      responseData = {
        topSellingProducts: generateTopSellingProducts(),
      }
      break
    case "channels":
      responseData = {
        salesByChannel: generateSalesByChannel(),
      }
      break
    case "regions":
      responseData = {
        salesByRegion: generateSalesByRegion(),
      }
      break
    default:
      responseData = {
        salesData: generateSalesData(),
      }
  }

  return NextResponse.json(responseData)
}
