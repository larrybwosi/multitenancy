import { Organization, OrganizationSettings } from "@/prisma/client";
import { useQuery } from "@tanstack/react-query";

interface OrganizationWithSettings extends Organization {
  settings: OrganizationSettings;
}

export function useOrganization() {
  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Failed to fetch organization");
      const data = await res.json();
      return data as OrganizationWithSettings;
    },
  });

  return {
    organization,
    isLoading,
  };
}