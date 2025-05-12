"use client";

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Create a client
const queryClient = new QueryClient();

interface FinancialSummary {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  salesGoal: number;
  expenseBudget: number;
}

interface SalesDetailItem {
  month?: string; // For salesOverTime
  name?: string;  // For topSalesCategories
  sales?: number; // For salesOverTime
  amount?: number; // For topSalesCategories
  percentage?: number; // For topSalesCategories
}

interface SalesDetails {
  salesOverTime: SalesDetailItem[];
  topSalesCategories: SalesDetailItem[];
}

interface ExpenseDetailItem {
  month?: string; // For expensesOverTime
  name?: string;  // For topExpenseCategories
  expenses?: number; // For expensesOverTime
  amount?: number; // For topExpenseCategories
  percentage?: number; // For topExpenseCategories
}

interface ExpensesDetails {
  expensesOverTime: ExpenseDetailItem[];
  topExpenseCategories: ExpenseDetailItem[];
}

async function fetchFinancialSummary(): Promise<FinancialSummary> {
  const res = await fetch('/api/finance/summary');
  if (!res.ok) {
    throw new Error('Network response was not ok for summary');
  }
  return res.json();
}

async function fetchSalesDetails(): Promise<SalesDetails> {
  const res = await fetch('/api/finance/sales-details');
  if (!res.ok) {
    throw new Error('Network response was not ok for sales details');
  }
  return res.json();
}

async function fetchExpensesDetails(): Promise<ExpensesDetails> {
  const res = await fetch('/api/finance/expenses-details');
  if (!res.ok) {
    throw new Error('Network response was not ok for expenses details');
  }
  return res.json();
}

function FinanceDashboard() {
  const { data: summary, isLoading: isLoadingSummary, error: errorSummary } = useQuery<FinancialSummary, Error>({
    queryKey: ['financialSummary'],
    queryFn: fetchFinancialSummary,
  });

  const { data: salesDetails, isLoading: isLoadingSales, error: errorSales } = useQuery<SalesDetails, Error>({
    queryKey: ['salesDetails'],
    queryFn: fetchSalesDetails,
  });

  const { data: expensesDetails, isLoading: isLoadingExpenses, error: errorExpenses } = useQuery<ExpensesDetails, Error>({
    queryKey: ['expensesDetails'],
    queryFn: fetchExpensesDetails,
  });

  if (isLoadingSummary || isLoadingSales || isLoadingExpenses) {
    return <div className="p-6">Loading financial data...</div>;
  }

  if (errorSummary) {
    return <div className="p-6 text-red-500">Error loading summary: {errorSummary.message}</div>;
  }
  if (errorSales) {
    return <div className="p-6 text-red-500">Error loading sales details: {errorSales.message}</div>;
  }
  if (errorExpenses) {
    return <div className="p-6 text-red-500">Error loading expenses details: {errorExpenses.message}</div>;
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Finance Overview</h1>

      {/* Summary Section */}
      {summary && (
        <section className="mb-12 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-lg font-medium text-blue-700">Total Sales</h3>
              <p className="text-3xl font-bold text-blue-900">${summary.totalSales.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Goal: ${summary.salesGoal.toLocaleString()}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(summary.totalSales / summary.salesGoal) * 100}%` }}></div>
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-md">
              <h3 className="text-lg font-medium text-red-700">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-900">${summary.totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Budget: ${summary.expenseBudget.toLocaleString()}</p>
               <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${(summary.totalExpenses / summary.expenseBudget) * 100}%` }}></div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="text-lg font-medium text-green-700">Net Profit</h3>
              <p className="text-3xl font-bold text-green-900">${summary.profit.toLocaleString()}</p>
            </div>
          </div>
        </section>
      )}

      {/* Sales Details Section */}
      {salesDetails && (
        <section className="mb-12 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Sales Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium mb-4 text-gray-600">Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesDetails.salesOverTime} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="sales" fill="#2563EB" name="Monthly Sales" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-4 text-sm text-gray-600">This chart shows the trend of sales over the past few months. Consistent growth or identifying seasonal patterns can be key takeaways.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-4 text-gray-600">Top Sales Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesDetails.topSalesCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="name"
                    label={({ name, percent }: { name?: string, percent?: number }) => {
                      if (name && typeof percent === 'number') return `${name} (${(percent * 100).toFixed(0)}%)`;
                      return '';
                    }}
                  >
                    {salesDetails.topSalesCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, entry?: { payload?: SalesDetailItem }) => {
                    if (entry && entry.payload && typeof entry.payload.percentage === 'number') {
                        return `$${value.toLocaleString()} (${entry.payload.percentage.toFixed(1)}%)`;
                    }
                    return `$${value.toLocaleString()}`;
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-4 text-sm text-gray-600">Understanding which products or services contribute most to revenue helps in strategic decision-making and resource allocation.</p>
            </div>
          </div>
        </section>
      )}

      {/* Expenses Details Section */}
      {expensesDetails && (
         <section className="p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Expense Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium mb-4 text-gray-600">Expenses Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesDetails.expensesOverTime} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="expenses" fill="#DC2626" name="Monthly Expenses" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-4 text-sm text-gray-600">Tracking expenses over time highlights spending trends and potential areas for cost optimization.</p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-4 text-gray-600">Top Expense Categories</h3>
               <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesDetails.topExpenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="name"
                    label={({ name, percent }: { name?: string, percent?: number }) => {
                      if (name && typeof percent === 'number') return `${name} (${(percent * 100).toFixed(0)}%)`;
                      return '';
                    }}
                  >
                    {expensesDetails.topExpenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, entry?: { payload?: ExpenseDetailItem }) => {
                     if (entry && entry.payload && typeof entry.payload.percentage === 'number') {
                        return `$${value.toLocaleString()} (${entry.payload.percentage.toFixed(1)}%)`;
                    }
                    return `$${value.toLocaleString()}`;
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-4 text-sm text-gray-600">Identifying major expense categories is crucial for budget management and finding opportunities to improve profitability.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function FinancePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinanceDashboard />
    </QueryClientProvider>
  );
}
