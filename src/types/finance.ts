export interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  category: string
  paymentMethod: string
  status: "Completed" | "Pending" | "Failed"
  notes?: string
  attachments?: {
    id: string
    name: string
    url: string
    size: string
  }[]
}

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