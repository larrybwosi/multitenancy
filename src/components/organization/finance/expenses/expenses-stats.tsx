'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  AlertCircleIcon,
  RepeatIcon,
  CheckCircleIcon,
} from 'lucide-react';

interface Expense {
  amount: string | number;
  status?: string;
  taxDeductible?: boolean;
  isRecurring?: boolean;
  createdAt: string;
}

interface ExpensesStatsProps {
  expenses: Expense[] | undefined | null;
}

export function ExpensesStats({ expenses = [] }: ExpensesStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Parse amount to number (handle both string and number types)
  const parseAmount = (expense: Expense) => {
    return typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
  };

  // Calculate total expenses
  const totalExpenses = safeExpenses.reduce((sum, expense) => sum + parseAmount(expense), 0);

  // Calculate expenses by status
  const paidExpenses = safeExpenses
    .filter(expense => expense.status?.toLowerCase() === 'paid')
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  const pendingExpenses = safeExpenses
    .filter(expense => expense.status?.toLowerCase() === 'pending')
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  const overdueExpenses = safeExpenses
    .filter(expense => expense.status?.toLowerCase() === 'overdue')
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  // Calculate tax deductible expenses
  const taxDeductibleExpenses = safeExpenses
    .filter(expense => expense.taxDeductible)
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  // Calculate recurring expenses
  const recurringExpenses = safeExpenses
    .filter(expense => expense.isRecurring)
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  // Calculate month-over-month change
  const currentMonthExpenses = safeExpenses
    .filter(expense => new Date(expense.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  const lastMonthExpenses = safeExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      const lastMonth = new Date().getMonth() - 1;
      return expenseDate.getMonth() === (lastMonth < 0 ? 11 : lastMonth);
    })
    .reduce((sum, expense) => sum + parseAmount(expense), 0);

  const monthOverMonthChange =
    lastMonthExpenses > 0
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : currentMonthExpenses > 0
        ? 100
        : 0;

  const paidCount = safeExpenses.filter(e => e.status?.toLowerCase() === 'paid').length;
  const pendingCount = safeExpenses.filter(e => e.status?.toLowerCase() === 'pending').length;
  const overdueCount = safeExpenses.filter(e => e.status?.toLowerCase() === 'overdue').length;
  const recurringCount = safeExpenses.filter(e => e.isRecurring).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          {monthOverMonthChange > 0 ? (
            <TrendingUpIcon className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthOverMonthChange > 0 ? (
              <span className="text-red-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                {Math.abs(monthOverMonthChange).toFixed(1)}% from last month
              </span>
            ) : (
              <span className="text-green-500 flex items-center">
                <ArrowDownIcon className="mr-1 h-3 w-3" />
                {Math.abs(monthOverMonthChange).toFixed(1)}% from last month
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-yellow-500" />
            Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} expense{pendingCount !== 1 ? 's' : ''} awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
            Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overdueExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {overdueCount} overdue expense{overdueCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            Paid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(paidExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {paidCount} expense{paidCount !== 1 ? 's' : ''} paid
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RepeatIcon className="h-4 w-4 text-blue-500" />
            Recurring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(recurringExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {recurringCount} recurring expense{recurringCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(taxDeductibleExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalExpenses > 0 ? ((taxDeductibleExpenses / totalExpenses) * 100).toFixed(1) : '0'}% of total expenses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
