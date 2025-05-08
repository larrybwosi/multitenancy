export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashBalance: number;
}

export interface ProfitLossData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export interface UpcomingPayment {
  id: string;
  dueDate: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface DashboardData {
  summary: FinancialSummary;
  profitLoss: ProfitLossData[];
  expensesByCategory: ExpenseCategory[];
  recentTransactions: Transaction[];
  upcomingPayments: UpcomingPayment[];
  cashFlow: CashFlowData[];
}

export type Period = 'month' | 'quarter' | 'year';

export interface TransactionCategories {
  income: string[]
  expense: string[]
}

export interface PaginationInfo {
  page: number
  limit: number
  totalTransactions: number
  totalPages: number
}

export interface TransactionsResponse {
  transactions: Transaction[]
  pagination: PaginationInfo
  categories: TransactionCategories
} 