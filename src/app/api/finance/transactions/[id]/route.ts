import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = await params

  // In a real application, you would fetch the transaction from a database
  // For this mock API, we'll just return a mock transaction
  const transaction = {
    id,
    description: `Transaction ${id}`,
    amount: 1250.0,
    type: "income",
    date: "2023-05-01",
    category: "Product Sales",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    notes: "This is a sample transaction",
    attachments: [
      {
        id: "att_001",
        name: "receipt.pdf",
        url: "https://example.com/receipts/receipt.pdf",
        size: "256KB",
      },
    ],
    metadata: {
      createdAt: "2023-05-01T10:30:00Z",
      updatedAt: "2023-05-01T10:30:00Z",
      createdBy: "user_001",
    },
  }

  return NextResponse.json(transaction)
}
