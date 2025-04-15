import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock data for a specific warehouse
  return NextResponse.json({
    warehouse: {
      id,
      name: id === "wh_01" ? "Main Warehouse" : "Sample Warehouse",
      location: "New York, NY",
      capacity: 10000,
      used: 7500,
      manager: "John Smith",
      status: "ACTIVE",
      productCount: 1250,
      lastUpdated: "2023-10-15T14:30:00.000Z",
      description: "Our main storage facility for high-volume products",
      address: "123 Storage Ave, New York, NY 10001",
      phone: "(212) 555-1234",
      email: "warehouse@example.com",
    },
  })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const data = await request.json()

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, you would update this in a database
  return NextResponse.json({
    id,
    ...data,
    lastUpdated: new Date().toISOString(),
  })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, you would delete this from a database
  return NextResponse.json({ success: true })
}
