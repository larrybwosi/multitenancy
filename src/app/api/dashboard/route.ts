import { NextResponse } from "next/server"

export async function GET() {
  // This is a placeholder API route that would normally fetch data from a database
  // In a real application, you would connect to your database and return actual data

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    organization: {
      id: "org_01",
      name: "Orlando Inc.",
      logo: "/logo.svg",
      description: "A leading provider of innovative solutions for businesses of all sizes.",
      createdAt: "2023-01-15T08:00:00.000Z",
    },
    metrics: {
      totalStaff: 250,
      totalApplications: 200,
      totalProjects: 38,
      totalDepartments: 8,
      staffGrowth: 12, // percentage growth from last quarter
      applicationsGrowth: 0.2, // percentage growth from last quarter
      projectsGrowth: 4, // percentage growth from last quarter
      departmentsChange: 0, // no change
    },
    applications: {
      total: 200,
      pending: 100,
      approved: 60,
      rejected: 40,
    },
    payroll: {
      summary: [
        { month: "Sep", netSalary: 280000, tax: 70000, loan: 150000 },
        { month: "Oct", netSalary: 290000, tax: 75000, loan: 160000 },
        { month: "Nov", netSalary: 300000, tax: 80000, loan: 170000 },
        { month: "Dec", netSalary: 310000, tax: 85000, loan: 180000 },
        { month: "Jan", netSalary: 320000, tax: 90000, loan: 190000 },
      ],
    },
    income: {
      total: 11800000,
      growth: 21, // percentage growth from last month
      monthly: [
        { month: "Sep", amount: 2100000 },
        { month: "Oct", amount: 2300000 },
        { month: "Nov", amount: 2400000 },
        { month: "Dec", amount: 2500000 },
        { month: "Jan", amount: 2500000 },
      ],
    },
    paymentVouchers: [
      { id: "01", subject: "Request for FARS for October 2022", date: "25/10/2025", status: "Pending" },
      { id: "02", subject: "Request for project proposal fee", date: "19/10/2025", status: "Approved" },
      { id: "03", subject: "Request for FARS for October 2022", date: "10/10/2025", status: "Approved" },
      { id: "04", subject: "Request for project proposal fee", date: "03/10/2025", status: "Pending" },
    ],
    budgetHistory: [
      { id: "01", budgetNo: "00211235", budgetedAmount: 14000000, actualAmount: 13100000, date: "25/10/2025" },
      { id: "02", budgetNo: "36211235", budgetedAmount: 4000000, actualAmount: 5000000, date: "22/10/2025" },
      { id: "03", budgetNo: "00214455", budgetedAmount: 22000000, actualAmount: 14000000, date: "20/10/2025" },
      { id: "04", budgetNo: "00214465", budgetedAmount: 3000000, actualAmount: 1800000, date: "20/10/2025" },
    ],
  })
}
