export async function GET() {
  // In a real application, you would fetch this data from your database
  // and filter it based on the organization of the logged-in user.
  const summaryData = {
    totalSales: 125000,
    totalExpenses: 75000,
    profit: 50000,
    salesGoal: 150000,
    expenseBudget: 80000,
  };

  return new Response(JSON.stringify(summaryData), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
} 