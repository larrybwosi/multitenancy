import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Generate mock transaction data
  const transactions = []
  const transactionTypes = ["IN", "OUT"]
  const products = ["Premium Laptop", "Wireless Headphones", "Office Desk Chair", "Smartphone Case", "4K Monitor"]

  for (let i = 0; i < 20; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    transactions.push({
      id: `tr_${i}`,
      warehouseId: id,
      type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      productName: products[Math.floor(Math.random() * products.length)],
      quantity: Math.floor(Math.random() * 50) + 1,
      date: date.toISOString(),
      reference: `REF-${Math.floor(Math.random() * 10000)}`,
      user: "John Doe",
    })
  }

  return NextResponse.json({ transactions })
}
