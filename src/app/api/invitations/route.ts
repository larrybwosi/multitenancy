import { NextResponse } from "next/server"

export async function GET() {
  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    invitations: [
      {
        id: "inv_01",
        email: "alex.brown@example.com",
        role: "MANAGER",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        inviterId: "user_01",
      },
      {
        id: "inv_02",
        email: "sarah.miller@example.com",
        role: "EMPLOYEE",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        inviterId: "user_01",
      },
      {
        id: "inv_03",
        email: "david.taylor@example.com",
        role: "CASHIER",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        inviterId: "user_02",
      },
    ],
  })
}
