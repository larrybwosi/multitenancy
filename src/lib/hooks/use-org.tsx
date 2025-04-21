import { getServerAuthContext } from "@/actions/auth";
import { useQuery } from "@tanstack/react-query";

export function useOrganizationName() {
  return useQuery({
    queryKey: ["organizationName"],
    queryFn: async () => {
      const { organizationName } = await getServerAuthContext();
      return organizationName;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours in milliseconds
    // cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache time
    retry: false, // Don't retry if the request fails
  });
}
