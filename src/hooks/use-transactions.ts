import { useQuery } from "@tanstack/react-query"
import { TransactionsResponse } from "@/types/finance"

interface UseTransactionsParams {
  page: number
  limit?: number
  type?: string
  category?: string
  startDate?: string
  endDate?: string
  search?: string
}

export function useTransactions({
  page,
  limit = 10,
  type,
  category,
  startDate,
  endDate,
  search,
}: UseTransactionsParams) {
  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", { page, limit, type, category, startDate, endDate, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      params.append("page", String(page))
      params.append("limit", String(limit))
      
      if (type) params.append("type", type)
      if (category) params.append("category", category)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (search) params.append("search", search)

      const response = await fetch(`/api/finance/transactions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      return response.json()
    },
  })
} 