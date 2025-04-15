import { NextResponse } from "next/server"

// Generate customer acquisition data
function generateCustomerAcquisitionData() {
  const months = 12
  const data = []

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))

    const newCustomers = Math.floor(Math.random() * 200) + 100
    const churnedCustomers = Math.floor(Math.random() * 50) + 20
    const netGrowth = newCustomers - churnedCustomers
    const totalCustomers = 1000 + i * netGrowth
    const acquisitionCost = 20 + Math.random() * 15

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      newCustomers,
      churnedCustomers,
      netGrowth,
      totalCustomers,
      acquisitionCost,
    })
  }

  return data
}

// Generate customer segmentation data
function generateCustomerSegmentation() {
  return [
    { name: "New Customers", value: 25 + Math.random() * 5 },
    { name: "Occasional", value: 30 + Math.random() * 5 },
    { name: "Regular", value: 20 + Math.random() * 5 },
    { name: "Loyal", value: 15 + Math.random() * 5 },
    { name: "VIP", value: 10 + Math.random() * 3 },
  ]
}

// Generate customer lifetime value data
function generateCustomerLifetimeValue() {
  const segments = ["New", "Occasional", "Regular", "Loyal", "VIP"]

  return segments.map((segment) => {
    // Different base values for different segments
    const baseValues = {
      New: 100,
      Occasional: 300,
      Regular: 800,
      Loyal: 1500,
      VIP: 3000,
    }

    const baseValue = baseValues[segment] || 500
    const randomFactor = 0.8 + Math.random() * 0.4 // 80-120% of base value

    return {
      segment,
      ltv: Math.round(baseValue * randomFactor),
      averageOrderValue: Math.round((baseValue / 5) * randomFactor),
      purchaseFrequency: (1 + segments.indexOf(segment) * 2 * randomFactor).toFixed(1),
      retentionRate: (50 + segments.indexOf(segment) * 10 * randomFactor).toFixed(1) + "%",
    }
  })
}

// Generate top customers data
function generateTopCustomers() {
  const customers = [
    { id: "C1001", name: "Acme Corporation", type: "Business" },
    { id: "C1002", name: "TechNova Inc.", type: "Business" },
    { id: "C1003", name: "Global Retail Ltd", type: "Business" },
    { id: "C1004", name: "John Smith", type: "Individual" },
    { id: "C1005", name: "Innovative Solutions", type: "Business" },
    { id: "C1006", name: "Sarah Johnson", type: "Individual" },
    { id: "C1007", name: "Metro Distributors", type: "Business" },
    { id: "C1008", name: "Robert Williams", type: "Individual" },
    { id: "C1009", name: "Sunshine Enterprises", type: "Business" },
    { id: "C1010", name: "Emily Davis", type: "Individual" },
  ]

  return customers.map((customer) => ({
    ...customer,
    totalSpent: Math.round(1000 + Math.random() * 9000),
    orders: Math.floor(5 + Math.random() * 20),
    lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    ),
    segment: ["Regular", "Loyal", "VIP"][Math.floor(Math.random() * 3)],
  }))
}

// Generate customer satisfaction data
function generateCustomerSatisfactionData() {
  const months = 12
  const data = []

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      nps: Math.floor(Math.random() * 20) + 40, // 40-60
      csat: Math.floor(Math.random() * 15) + 75, // 75-90
      reviewScore: (3.5 + Math.random() * 1.0).toFixed(1), // 3.5-4.5
      responseRate: Math.floor(Math.random() * 20) + 20, // 20-40%
    })
  }

  return data
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
      const acquisitionData = generateCustomerAcquisitionData()
      const segmentationData = generateCustomerSegmentation()

      // Get the latest month data
      const latestMonth = acquisitionData[acquisitionData.length - 1]

      responseData = {
        acquisitionData,
        segmentationData,
        summary: {
          totalCustomers: latestMonth.totalCustomers,
          newCustomers: latestMonth.newCustomers,
          churnRate:
            ((latestMonth.churnedCustomers / (latestMonth.totalCustomers - latestMonth.netGrowth)) * 100).toFixed(1) +
            "%",
          averageLTV: Math.round(500 + Math.random() * 500),
          acquisitionCost: latestMonth.acquisitionCost.toFixed(2),
        },
      }
      break
    case "lifetime":
      responseData = {
        lifetimeValueData: generateCustomerLifetimeValue(),
      }
      break
    case "topCustomers":
      responseData = {
        topCustomers: generateTopCustomers(),
      }
      break
    case "satisfaction":
      responseData = {
        satisfactionData: generateCustomerSatisfactionData(),
      }
      break
    default:
      responseData = {
        acquisitionData: generateCustomerAcquisitionData(),
      }
  }

  return NextResponse.json(responseData)
}
