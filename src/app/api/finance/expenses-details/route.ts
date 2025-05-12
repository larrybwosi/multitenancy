export async function GET() {
  // Placeholder data - replace with actual database queries
  const expensesDetails = {
    expensesOverTime: [
      { month: "Jan", expenses: 10000 },
      { month: "Feb", expenses: 12000 },
      { month: "Mar", expenses: 11000 },
      { month: "Apr", expenses: 13000 },
      { month: "May", expenses: 14000 },
      { month: "Jun", expenses: 15000 },
    ],
    topExpenseCategories: [
      { id: "expCat1", name: "Salaries", amount: 30000, percentage: 40 },
      { id: "expCat2", name: "Rent", amount: 15000, percentage: 20 },
      { id: "expCat3", name: "Software Subscriptions", amount: 10000, percentage: 13.33 },
      { id: "expCat4", name: "Marketing", amount: 7500, percentage: 10 },
      { id: "expCat5", name: "Utilities", amount: 5000, percentage: 6.67 },
      { id: "expCat6", name: "Other", amount: 7500, percentage: 10 },
    ],
  };

  return new Response(JSON.stringify(expensesDetails), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
} 