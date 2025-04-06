import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import useSWRMutation, {
  SWRMutationConfiguration,
  SWRMutationResponse,
} from "swr/mutation";
import {
  Supplier,
  Customer,
  Sale,
  StockBatch,
  StockAdjustment,
  StockAdjustmentReason,
} from "@prisma/client"; 

// --- Generic Fetcher ---
// You can use axios or any other library too
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})); // Attempt to parse error JSON
    const error = new Error(
      errorBody.error ||
        `An error occurred while fetching: ${res.statusText} (${res.status})`
    );
    // You might want to attach status code or full response
    // (error as any).status = res.status;
    // (error as any).info = errorBody;
    throw error;
  }
  return res.json();
};

// --- Generic Mutator for POST/PUT/DELETE ---
interface MutateOptions<TBody = unknown> {
  method: "POST" | "PUT" | "DELETE";
  body?: TBody;
}
const mutator = async <TResponse = unknown, TBody = unknown>(
  url: string,
  options: MutateOptions<TBody>
): Promise<TResponse> => {
  const { method, body } = options;
  const res = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      // Add other headers like Authorization if needed
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(
      errorBody.error || `API Error: ${res.statusText} (${res.status})`
    );
    // (error as any).status = res.status;
    // (error as any).info = errorBody.details || errorBody;
    throw error;
  }

  // Handle empty responses for DELETE (204 No Content)
  if (res.status === 204 || method === "DELETE") {
    return undefined as TResponse; // Or return a success message/flag
  }

  return res.json();
};

// --- Type Definitions for API Payloads (matching Zod schemas) ---
// Optional but good for type safety when calling mutations
import { z } from "zod";
import {
  SupplierSchema,
  UpdateSupplierSchema,
  CustomerSchema,
  UpdateCustomerSchema,
  CreateSaleSchema,
  CreateStockAdjustmentSchema,
} from "@/lib/validations/schemas"; // Adjust path as needed

type SupplierPayload = z.infer<typeof SupplierSchema>;
type UpdateSupplierPayload = z.infer<typeof UpdateSupplierSchema>;
type CustomerPayload = z.infer<typeof CustomerSchema>;
type UpdateCustomerPayload = z.infer<typeof UpdateCustomerSchema>;
type CreateSalePayload = z.infer<typeof CreateSaleSchema>;
type CreateStockAdjustmentPayload = z.infer<typeof CreateStockAdjustmentSchema>;

// Type for Paginated Responses (used by GET list endpoints)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// --- Supplier Hooks ---

// Hook to get list of suppliers
export const useSuppliers = (
  options?: SWRConfiguration
): SWRResponse<Supplier[], Error> => {
  return useSWR<Supplier[]>("/api/suppliers", fetcher, options);
};

// Hook to get supplier details (including calculated fields)
// Define a more specific type for the response if needed
interface SupplierDetailsResponse extends Supplier {
  lastOrderDate: string | null; // Dates often come as strings
  totalSpent: string;
  totalItemsPurchased: number;
}
export const useSupplierDetails = (
  supplierId: string | null | undefined, // Allow null/undefined to disable fetching
  options?: SWRConfiguration
): SWRResponse<SupplierDetailsResponse, Error> => {
  const key = supplierId ? `/api/suppliers/${supplierId}` : null; // Disable fetch if no ID
  return useSWR<SupplierDetailsResponse>(key, fetcher, options);
};

// Hook to add a supplier
export const useAddSupplier = (
  options?: SWRMutationConfiguration<Supplier, Error, string, SupplierPayload>
): SWRMutationResponse<Supplier, Error, string, SupplierPayload> => {
  return useSWRMutation<Supplier, Error, string, SupplierPayload>(
    "/api/suppliers", // Key doesn't matter much here but can be used
    (url, { arg }) =>
      mutator<Supplier, SupplierPayload>(url, { method: "POST", body: arg }),
    options
  );
};

// Hook to update a supplier
export const useUpdateSupplier = (
  supplierId: string | undefined,
  options?: SWRMutationConfiguration<
    Supplier,
    Error,
    string,
    UpdateSupplierPayload
  >
): SWRMutationResponse<Supplier, Error, string, UpdateSupplierPayload> => {
  const key = supplierId ? `/api/suppliers/${supplierId}` : null; // Use specific key for mutation state if needed
  return useSWRMutation<Supplier, Error, string, UpdateSupplierPayload>(
    key ?? "", // SWRMutation expects a non-null key string
    (url, { arg }) => {
      if (!supplierId) throw new Error("Supplier ID is required for update");
      return mutator<Supplier, UpdateSupplierPayload>(
        `/api/suppliers/${supplierId}`,
        { method: "PUT", body: arg }
      );
    },
    options
  );
};

// Hook to delete (deactivate) a supplier
export const useDeleteSupplier = (
  supplierId: string | undefined,
  options?: SWRMutationConfiguration<void, Error, string, never> // No body arg expected
): SWRMutationResponse<void, Error, string, never> => {
  const key = supplierId ? `/api/suppliers/${supplierId}/delete` : null;
  return useSWRMutation<void, Error, string, never>(
    key ?? "",
    () => {
      if (!supplierId) throw new Error("Supplier ID is required for delete");
      return mutator<void, never>(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
      });
    },
    options
  );
};

// --- Customer Hooks (Similar structure to Suppliers) ---

export const useCustomers = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  options?: SWRConfiguration
): SWRResponse<PaginatedResponse<Customer>, Error> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  const key = `/api/customers?${params.toString()}`;
  return useSWR<PaginatedResponse<Customer>>(key, fetcher, options);
};

// Define CustomerDetailsResponse type if needed (includes sales/loyalty history)
export const useCustomerDetails = (
  customerId: string | null | undefined,
  options?: SWRConfiguration
): SWRResponse<Customer, Error> => {
  // Replace 'any' with specific CustomerDetailsResponse type
  const key = customerId ? `/api/customers/${customerId}` : null;
  return useSWR<Customer>(key, fetcher, options);
};

export const useAddCustomer = (
  options?: SWRMutationConfiguration<Customer, any, string, CustomerPayload>
): SWRMutationResponse<Customer, any, string, CustomerPayload> => {
  return useSWRMutation<Customer, any, string, CustomerPayload>(
    "/api/customers",
    (url, { arg }) =>
      mutator<Customer, CustomerPayload>(url, { method: "POST", body: arg }),
    options
  );
};

export const useUpdateCustomer = (
  customerId: string | undefined,
  options?: SWRMutationConfiguration<
    Customer,
    any,
    string,
    UpdateCustomerPayload
  >
): SWRMutationResponse<Customer, any, string, UpdateCustomerPayload> => {
  return useSWRMutation<Customer, any, string, UpdateCustomerPayload>(
    customerId ? `/api/customers/${customerId}` : "",
    (url, { arg }) => {
      if (!customerId) throw new Error("Customer ID required");
      return mutator<Customer, UpdateCustomerPayload>(
        `/api/customers/${customerId}`,
        { method: "PUT", body: arg }
      );
    },
    options
  );
};

export const useDeleteCustomer = (
  customerId: string | undefined,
  options?: SWRMutationConfiguration<void, any, string, never>
): SWRMutationResponse<void, any, string, never> => {
  return useSWRMutation<void, any, string, never>(
    customerId ? `/api/customers/${customerId}/delete` : "",
    () => {
      if (!customerId) throw new Error("Customer ID required");
      return mutator<void, never>(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
    },
    options
  );
};

// --- Sales Hooks ---

// Define SaleListFilters type if needed
interface SaleListFilters {
  page?: number;
  limit?: number;
  customerId?: string;
  userId?: string;
  status?: string; // PaymentStatus enum value
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
}

// Define SaleListItem type if needed (summary view)
// Define SaleDetailsResponse type (full view from GET /api/sales/[saleId])

export const useSales = (
  filters: SaleListFilters = { page: 1, limit: 10 },
  options?: SWRConfiguration
): SWRResponse<PaginatedResponse<any>, any> => {
  // Replace 'any' with SaleListItem type
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  const key = `/api/sales?${params.toString()}`;
  return useSWR<PaginatedResponse<any>>(key, fetcher, options);
};

export const useSaleDetails = (
  saleId: string | null | undefined,
  options?: SWRConfiguration
): SWRResponse<any, any> => {
  // Replace 'any' with SaleDetailsResponse type
  const key = saleId ? `/api/sales/${saleId}` : null;
  return useSWR<any>(key, fetcher, options);
};

export const useCreateSale = (
  options?: SWRMutationConfiguration<Sale, any, string, CreateSalePayload>
): SWRMutationResponse<Sale, any, string, CreateSalePayload> => {
  return useSWRMutation<Sale, any, string, CreateSalePayload>(
    "/api/sales",
    (url, { arg }) =>
      mutator<Sale, CreateSalePayload>(url, { method: "POST", body: arg }),
    options
  );
};

// --- Stock Hooks ---

interface StockOverviewItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  costPrice: string;
  sellPrice: string;
  value: string;
}

export const useStockOverview = (
  options?: SWRConfiguration
): SWRResponse<StockOverviewItem[], Error> => {
  return useSWR<StockOverviewItem[]>("/api/stock/overview", fetcher, options);
};

export const useStockValue = (
  options?: SWRConfiguration
): SWRResponse<{ totalValue: string }, Error> => {
  return useSWR<{ totalValue: string }>("/api/stock/value", fetcher, options);
};

interface StockBatchFilters {
  productId?: string;
  variantId?: string;
  includeEmpty?: boolean;
}

export const useStockBatches = (
  filters: StockBatchFilters = {},
  options?: SWRConfiguration
): SWRResponse<StockBatch[], Error> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  const key = `/api/stock/batches?${params.toString()}`;
  return useSWR<StockBatch[]>(key, fetcher, options);
};

interface StockAdjustmentFilters {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  userId?: string;
  reason?: StockAdjustmentReason;
  startDate?: string;
  endDate?: string;
}

export const useStockAdjustments = (
  filters: StockAdjustmentFilters = { page: 1, limit: 10 },
  options?: SWRConfiguration
): SWRResponse<PaginatedResponse<StockAdjustment>, Error> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  const key = `/api/stock/adjustment?${params.toString()}`;
  return useSWR<PaginatedResponse<StockAdjustment>>(key, fetcher, options);
};

export const useCreateStockAdjustment = (
  options?: SWRMutationConfiguration<
    StockAdjustment,
    Error,
    string,
    CreateStockAdjustmentPayload
  >
): SWRMutationResponse<
  StockAdjustment,
  Error,
  string,
  CreateStockAdjustmentPayload
> => {
  return useSWRMutation<
    StockAdjustment,
    Error,
    string,
    CreateStockAdjustmentPayload
  >(
    "/api/stock/adjustment",
    (url, { arg }) =>
      mutator<StockAdjustment, CreateStockAdjustmentPayload>(url, {
        method: "POST",
        body: arg,
      }),
    options
  );
};
