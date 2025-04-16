import { useQuery } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export function useOrganization() {
  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Failed to fetch organization");
      const data = await res.json();
      return data as Organization;
    },
  });

  return {
    organization,
    isLoading,
  };
}