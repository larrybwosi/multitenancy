import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axios.get("/api/customers");
      if (res.status !== 200) {
        throw new Error("Failed to fetch customers");
      }
      return res.data;
    },
  });
}