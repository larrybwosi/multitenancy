"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Building, Tag } from "lucide-react"

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  department: string
  description: string
  status: string
}

interface ExpenseAnalyticsProps {
  expenses: Expense[]
  activeTab: string
  timeframe: string
}

export function ExpenseAnalytics({ expenses, activeTab, timeframe }: ExpenseAnalyticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Enhanced color palette for professional charts
  const COLORS = {
    primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    gradient: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
    neutral: ['#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0'],
  };

  // Enhanced expense grouping functions
  const groupExpensesByCategory = () => {
    const grouped = expenses.reduce(
      (acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, percentage: 0 };
        }
        acc[category].total += expense.amount;
        acc[category].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number; percentage: number }>
    );

    const totalAmount = Object.values(grouped).reduce((sum, item) => sum + item.total, 0);

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        value: data.total,
        count: data.count,
        percentage: data.total / totalAmount,
        color: COLORS.primary[Object.keys(grouped).indexOf(name) % COLORS.primary.length],
      }))
      .sort((a, b) => b.value - a.value);
  };

  const groupExpensesByDepartment = () => {
    const grouped = expenses.reduce(
      (acc, expense) => {
        const department = expense.department;
        if (!acc[department]) {
          acc[department] = { total: 0, count: 0 };
        }
        acc[department].total += expense.amount;
        acc[department].count += 1;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        value: data.total,
        count: data.count,
        color: COLORS.gradient[Object.keys(grouped).indexOf(name) % COLORS.gradient.length],
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getMonthlyTrend = () => {
    const monthlyData: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount, growth: 0 }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        if (aYear !== bYear) return Number(aYear) - Number(bYear);
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      })
      .map((item, index, array) => ({
        ...item,
        growth: index > 0 ? ((item.amount - array[index - 1].amount) / array[index - 1].amount) * 100 : 0,
      }));
  };

  const categoryData = groupExpensesByCategory();
  const departmentData = groupExpensesByDepartment();
  const trendData = getMonthlyTrend();

  // Mock enhanced data
  const yearOverYearData = [
    { month: 'Jan', current: 12500, previous: 10200, forecast: 13000 },
    { month: 'Feb', current: 13200, previous: 11000, forecast: 13500 },
    { month: 'Mar', current: 14100, previous: 12500, forecast: 14200 },
    { month: 'Apr', current: 12800, previous: 11800, forecast: 13100 },
    { month: 'May', current: 13500, previous: 12200, forecast: 13800 },
    { month: 'Jun', current: 15200, previous: 13100, forecast: 15500 },
  ];

  const categoryTrendsData = [
    { month: 'Jan', Office: 15000, Equipment: 8000, Travel: 3000, Marketing: 5000, Software: 2500 },
    { month: 'Feb', Office: 15500, Equipment: 8500, Travel: 3200, Marketing: 6000, Software: 2700 },
    { month: 'Mar', Office: 16000, Equipment: 7800, Travel: 3100, Marketing: 7000, Software: 2900 },
    { month: 'Apr', Office: 15800, Equipment: 8200, Travel: 3300, Marketing: 4500, Software: 2600 },
    { month: 'May', Office: 16200, Equipment: 8800, Travel: 3400, Marketing: 5500, Software: 2800 },
    { month: 'Jun', Office: 16500, Equipment: 9200, Travel: 3600, Marketing: 6500, Software: 3000 },
  ];

  const budgetUtilizationData = [
    { name: 'Administration', actual: 45000, budget: 50000, utilization: 0.9 },
    { name: 'Sales', actual: 38000, budget: 35000, utilization: 1.09 },
    { name: 'Marketing', actual: 32000, budget: 30000, utilization: 1.07 },
    { name: 'Operations', actual: 52000, budget: 55000, utilization: 0.95 },
    { name: 'IT', actual: 28000, budget: 30000, utilization: 0.93 },
    { name: 'HR', actual: 22000, budget: 25000, utilization: 0.88 },
  ];

  // Custom Tooltip Components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-medium text-gray-900">
                {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ title, value, subtitle, trend, icon: Icon }: any) => (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-2">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <TabsContent value="overview" className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Expenses"
            value={formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
            subtitle="This period"
            trend={5.2}
            icon={DollarSign}
          />
          <StatCard
            title="Average Monthly"
            value={formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0) / (trendData.length || 1))}
            subtitle="Per month"
            trend={-2.1}
            icon={Calendar}
          />
          <StatCard
            title="Top Category"
            value={categoryData[0]?.name || 'N/A'}
            subtitle={formatCurrency(categoryData[0]?.value || 0)}
            icon={Tag}
          />
          <StatCard
            title="Top Department"
            value={departmentData[0]?.name || 'N/A'}
            subtitle={formatCurrency(departmentData[0]?.value || 0)}
            icon={Building}
          />
        </div>

        {/* Main Charts */}
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Expense Trend Analysis</CardTitle>
              <CardDescription className="text-gray-500">
                Monthly expense patterns with growth indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    yAxisId="amount"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    yAxisId="growth"
                    orientation="right"
                    tickFormatter={value => `${value}%`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    yAxisId="amount"
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fill="url(#expenseGradient)"
                    strokeWidth={3}
                  />
                  <Line
                    yAxisId="growth"
                    type="monotone"
                    dataKey="growth"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Category Distribution</CardTitle>
              <CardDescription className="text-gray-500">Top 5 expense categories breakdown</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={categoryData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${formatPercent(percentage)})`}
                    labelLine={false}
                  >
                    {categoryData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {categoryData.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(category.value)}</div>
                      <div className="text-sm text-gray-500">{category.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Year-over-Year Comparison */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold">Year-over-Year Performance</CardTitle>
            <CardDescription className="text-gray-500">
              Compare current year expenses with previous year performance and forecasts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={yearOverYearData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="previous" name="Previous Year" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="Current Year" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast" name="Forecast" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories" className="space-y-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold">Category Performance Analysis</CardTitle>
            <CardDescription className="text-gray-500">
              Comprehensive breakdown of expenses across all categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Category Trends</CardTitle>
              <CardDescription className="text-gray-500">How expense categories have evolved over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={categoryTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Office" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Equipment" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Travel" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Marketing" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Software" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Category Insights</CardTitle>
              <CardDescription className="text-gray-500">Key metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-6">
                {categoryData.slice(0, 6).map((category, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <Badge variant="secondary">{formatPercent(category.percentage)}</Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{formatCurrency(category.value)}</span>
                      <span>{category.count} transactions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${category.percentage * 100}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                    {index < categoryData.slice(0, 6).length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="departments" className="space-y-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold">Department Expense Analysis</CardTitle>
            <CardDescription className="text-gray-500">
              Detailed breakdown of expenses across all departments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={departmentData} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Department Distribution</CardTitle>
              <CardDescription className="text-gray-500">Percentage allocation across departments</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    labelLine={true}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Budget Utilization</CardTitle>
              <CardDescription className="text-gray-500">
                Actual expenses vs. allocated budget by department
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={budgetUtilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {budgetUtilizationData.filter(d => d.utilization <= 1).length}
                  </div>
                  <div className="text-sm text-green-700">Under Budget</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {budgetUtilizationData.filter(d => d.utilization > 1).length}
                  </div>
                  <div className="text-sm text-red-700">Over Budget</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="trends" className="space-y-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold">Comprehensive Expense Trends</CardTitle>
            <CardDescription className="text-gray-500">
              Advanced analysis of expense patterns and forecasting
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  yAxisId="amount"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="growth"
                  orientation="right"
                  tickFormatter={value => `${value}%`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amount"
                  name="Expense Amount"
                  stroke="#6366F1"
                  fill="url(#trendGradient)"
                  strokeWidth={3}
                />
                <Line
                  yAxisId="growth"
                  type="monotone"
                  dataKey="growth"
                  name="Growth Rate"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Expense Forecast</CardTitle>
              <CardDescription className="text-gray-500">Projected expenses based on current trends</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Key Trend Indicators</CardTitle>
              <CardDescription className="text-gray-500">Important metrics for trend analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Average Monthly Growth</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trendData.length > 1
                        ? `${(trendData.reduce((sum, item) => sum + item.growth, 0) / (trendData.length - 1)).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Highest Spending Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trendData.length > 0
                        ? `${trendData.reduce((max, item) => (item.amount > max.amount ? item : max), trendData[0]).month}`
                        : 'N/A'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Growth Momentum</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trendData.length > 2
                        ? trendData[trendData.length - 1].growth > trendData[trendData.length - 2].growth
                          ? 'Accelerating'
                          : 'Decelerating'
                        : 'N/A'}
                    </p>
                  </div>
                  {trendData.length > 2 &&
                    (trendData[trendData.length - 1].growth > trendData[trendData.length - 2].growth ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}