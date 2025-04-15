// Basic data types
export interface ChartDataPoint {
  date: string
  value: number
}

export interface CategoryData {
  name: string
  value: number
  percentage: number
}

// Sales Report Types
export interface SalesData {
  overview: {
    summary: {
      totalRevenue: number
      totalOrders: number
      averageOrderValue: number
      conversionRate: number
    }
    salesData: Array<{
      date: string
      revenue: number
      orders: number
    }>
  }
  products: Array<{
    name: string
    revenue: number
    units: number
    growth: number
  }>
  channels: Array<{
    name: string
    value: number
    percentage: number
    description: string
  }>
  regions: Array<{
    name: string
    value: number
    percentage: number
  }>
}

// Financial Report Types
export interface FinancialData {
  profitLoss: {
    summary: {
      totalRevenue: number
      totalExpenses: number
      netProfit: number
      profitMargin: number
    }
    data: Array<{
      date: string
      revenue: number
      expenses: number
      profit: number
    }>
  }
  cashFlow: Array<{
    date: string
    inflow: number
    outflow: number
    balance: number
  }>
  balanceSheet: {
    assets: Array<{ name: string; value: number }>
    liabilities: Array<{ name: string; value: number }>
    equity: Array<{ name: string; value: number }>
  }
  expenses: Array<{
    category: string
    amount: number
    percentage: number
  }>
  ratios: Array<{
    name: string
    value: string
    description: string
    status: "good" | "warning" | "critical"
  }>
}

// Inventory Report Types
export interface InventoryData {
  overview: {
    summary: {
      totalInventory: number
      lowStockItems: number
      inventoryValue: number
      inventoryTurnover: number
    }
    inventoryData: Array<{
      date: string
      inStock: number
      allocated: number
      available: number
    }>
    categoryData: Array<{
      name: string
      value: number
      percentage: number
    }>
  }
  turnover: Array<{
    category: string
    value: number
    turnoverRate: number
    averageDays: number
  }>
  lowStock: Array<{
    id: string
    name: string
    sku: string
    currentStock: number
    minimumStock: number
    reorderPoint: number
    status: "warning" | "critical"
  }>
  warehouse: Array<{
    zone: string
    capacity: number
    utilization: number
    items: number
  }>
}

// Customer Report Types
export interface CustomerData {
  overview: {
    metrics: {
      totalCustomers: number
      activeCustomers: number
      newCustomers: number
      churned: number
    }
    chart: Array<{
      date: string
      active: number
      new: number
      churned: number
    }>
  }
  retention: {
    retentionRate: number
    cohortData: Array<{
      cohort: string
      size: number
      values: number[]
    }>
  }
  segments: Array<{
    segment: string
    customers: number
    revenue: number
    averageOrder: number
    frequency: number
  }>
  ltv: {
    average: number
    bySegment: Array<{
      segment: string
      value: number
      trend: number
    }>
  }
}