import { Organization } from "@prisma/client";
import { OrganizationCard } from "./card";
import { Skeleton } from "@/components/ui/skeleton";

interface OrganizationListProps {
  organizations: Organization[];
  isLoading: boolean;
  error: Error | null;
}

export function OrganizationList({
  organizations,
  isLoading,
  error,
}: OrganizationListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[220px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive">
        Error loading organizations: {error.message}
      </p>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No organizations found. Create one to get started!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  );
}
