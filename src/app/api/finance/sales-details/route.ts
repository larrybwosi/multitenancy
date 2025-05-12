export async function GET() {
  // Placeholder data - replace with actual database queries
  const salesDetails = {
    salesOverTime: [
      { month: "Jan", sales: 15000 },
      { month: "Feb", sales: 18000 },
      { month: "Mar", sales: 22000 },
      { month: "Apr", sales: 20000 },
      { month: "May", sales: 25000 },
      { month: "Jun", sales: 28000 },
    ],
    topSalesCategories: [
      { id: "cat1", name: "Product A Sales", amount: 50000, percentage: 40 },
      { id: "cat2", name: "Product B Sales", amount: 30000, percentage: 24 },
      { id: "cat3", name: "Service Revenue", amount: 25000, percentage: 20 },
      { id: "cat4", name: "Consulting", amount: 15000, percentage: 12 },
      { id: "cat5", name: "Other", amount: 5000, percentage: 4 },
    ],
  };

  return new Response(JSON.stringify(salesDetails), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
} 