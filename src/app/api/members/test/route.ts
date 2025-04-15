import { NextResponse } from "next/server"

export async function GET() {
  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    members: [
      {
        id: "mem_01",
        user: {
          id: "user_01",
          name: "John Doe",
          email: "john.doe@example.com",
          image: "/placeholder.svg?height=40&width=40",
        },
        role: "OWNER",
        createdAt: "2023-01-15T08:00:00.000Z",
      },
      {
        id: "mem_02",
        user: {
          id: "user_02",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          image: "/placeholder.svg?height=40&width=40",
        },
        role: "MANAGER",
        createdAt: "2023-02-10T10:30:00.000Z",
      },
      {
        id: "mem_03",
        user: {
          id: "user_03",
          name: "Robert Johnson",
          email: "robert.johnson@example.com",
          image: "/placeholder.svg?height=40&width=40",
        },
        role: "EMPLOYEE",
        createdAt: "2023-03-05T14:15:00.000Z",
      },
      {
        id: "mem_04",
        user: {
          id: "user_04",
          name: "Emily Davis",
          email: "emily.davis@example.com",
          image: "/placeholder.svg?height=40&width=40",
        },
        role: "CASHIER",
        createdAt: "2023-04-20T09:45:00.000Z",
      },
      {
        id: "mem_05",
        user: {
          id: "user_05",
          name: "Michael Wilson",
          email: "michael.wilson@example.com",
          image: "/placeholder.svg?height=40&width=40",
        },
        role: "VIEWER",
        createdAt: "2023-05-12T11:20:00.000Z",
      },
    ],
  })
}
