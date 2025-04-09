import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateSaleInput, CreateSaleInputSchema } from "@/lib/schemas";
import { Sale } from "@prisma/client"; 
import { toast } from "sonner";

// Type for the API response (adjust based on what your API actually returns)
type CreateSaleApiResponse = Sale & { items: unknown[] }; // Example if items are included

// Function to call the API endpoint
async function createSaleAPI(
  saleData: CreateSaleInput
): Promise<CreateSaleApiResponse> {
  // Validate data just before sending (optional, as it should be validated before calling mutate)
  const validation = CreateSaleInputSchema.safeParse(saleData);
  if (!validation.success) {
    console.error(
      "Client-side validation failed before sending:",
      validation.error
    );
    // Throwing here will trigger onError in useMutation
    throw new Error(`Client validation failed: ${validation.error.message}`);
  }

  const response = await fetch("/api/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validation.data), // Send validated data
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      console.error("Error parsing response:", e);
      // Ignore JSON parsing error if response body is not valid JSON
    }
    console.error("API Error Response:", errorData);
    throw new Error(
      errorData?.error ||
        `Failed to create sale: ${response.statusText} (Status: ${response.status})`
    );
  }

  return response.json() as Promise<CreateSaleApiResponse>;
}

// The React Hook using useMutation
export function useCreateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateSaleApiResponse, // Type of data returned on success
    Error, // Type of error
    CreateSaleInput // Type of variables passed to mutationFn
    // Add context type if using onMutate with optimistic updates
  >({
    mutationFn: createSaleAPI,
    // networkMode: 'offlineFirst', // This is the default, explicitly stating for clarity

    onSuccess: (data, variables) => {
      // --- Invalidate queries that should refetch after a sale is created ---
      // Example: Invalidate a list of recent sales
      queryClient.invalidateQueries({ queryKey: ["sales", "list"] }); // Adjust query key as needed
      // Maybe invalidate product stock queries if you display stock levels
      // queryClient.invalidateQueries({ queryKey: ['products'] });

      console.log("Sale created successfully:", data);
      toast.success('Sale Recorded Successfully', {
        description: `Sale ${data.saleNumber || `(ID: ${data.id.substring(0, 6)}...)`} created successfully.`,
      });

      // Optionally: Perform actions like clearing the cart here *after* success confirmation
      // This is safer than doing it in the component before mutation resolves.
      // actions.clearCart(); // Assuming actions is accessible or passed via context/props
    },

    onError: (error, variables) => {
      // Handle errors, e.g., show a toast notification
      console.error("Failed to create sale:", error);
      toast({
        title: "Sale Creation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      // TODO: If using optimistic updates, revert them here using the context from onMutate.
    },

    // Optional: onSettled runs after success or error
    // onSettled: (data, error, variables, context) => {
    //   console.log("Mutation settled (success or error)");
    // },
  });
}
