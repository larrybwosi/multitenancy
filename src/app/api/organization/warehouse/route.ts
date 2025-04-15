import { NextResponse } from "next/server"

export async function GET() {
  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    warehouses: [
      {
        id: "wh_01",
        name: "Main Warehouse",
        location: "New York, NY",
        capacity: 10000,
        used: 7500,
        manager: "John Smith",
        status: "ACTIVE",
        productCount: 1250,
        lastUpdated: "2023-10-15T14:30:00.000Z",
      },
      {
        id: "wh_02",
        name: "West Coast Distribution",
        location: "Los Angeles, CA",
        capacity: 15000,
        used: 9800,
        manager: "Emily Johnson",
        status: "ACTIVE",
        productCount: 1875,
        lastUpdated: "2023-10-14T11:45:00.000Z",
      },
      {
        id: "wh_03",
        name: "Midwest Fulfillment",
        location: "Chicago, IL",
        capacity: 8000,
        used: 7200,
        manager: "Michael Brown",
        status: "ACTIVE",
        productCount: 980,
        lastUpdated: "2023-10-16T09:15:00.000Z",
      },
      {
        id: "wh_04",
        name: "Southern Storage",
        location: "Atlanta, GA",
        capacity: 12000,
        used: 6500,
        manager: "Sarah Davis",
        status: "MAINTENANCE",
        productCount: 850,
        lastUpdated: "2023-10-12T16:20:00.000Z",
      },
      {
        id: "wh_05",
        name: "Northeast Hub",
        location: "Boston, MA",
        capacity: 7500,
        used: 4200,
        manager: "David Wilson",
        status: "ACTIVE",
        productCount: 620,
        lastUpdated: "2023-10-15T10:10:00.000Z",
      },
    ],
  })
}

export async function POST(request: Request) {
  const data = await request.json()

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, you would save this to a database
  return NextResponse.json({
    id: `wh_${Math.floor(Math.random() * 1000)}`,
    ...data,
    status: data.status || "ACTIVE",
    used: 0,
    productCount: 0,
    lastUpdated: new Date().toISOString(),
  })
}
