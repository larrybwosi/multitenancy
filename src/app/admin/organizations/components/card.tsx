// components/organizations/OrganizationCard.tsx
import Link from "next/link"; // Import Link for navigation
import { Organization } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { Globe, MapPin, Briefcase, Building, ArrowRight } from "lucide-react";

interface OrganizationCardProps {
  organization: Organization;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter((char) => /[a-zA-Z]/.test(char)) // Ensure it's a letter
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Helper to safely use the color
const getSafeColor = (
  color: string | null | undefined,
  defaultColor = "border-transparent"
) => {
  if (color && /^#[0-9A-F]{6}$/i.test(color)) {
    return color;
  }
  return defaultColor;
};

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const primaryColor = getSafeColor(organization.primaryColor);
  const hasPrimaryColor = primaryColor !== "border-transparent";

  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 flex flex-col group border-t-4"
      // Dynamically set the top border color using inline style
      style={{ borderTopColor: hasPrimaryColor ? primaryColor : "transparent" }}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar
          className="h-14 w-14 border-2"
          style={{
            borderColor: hasPrimaryColor ? primaryColor : "hsl(var(--border))",
          }}
        >
          <AvatarImage
            src={organization.logo ?? undefined}
            alt={`${organization.name} logo`}
          />
          <AvatarFallback
            style={{
              backgroundColor: hasPrimaryColor
                ? primaryColor + "20"
                : undefined,
            }}
          >
            {getInitials(organization.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 grid gap-1">
          <CardTitle className="text-lg leading-tight">
            {organization.name}
          </CardTitle>
          <CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
            <Briefcase className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {organization.type.charAt(0) +
                organization.type.slice(1).toLowerCase()}
            </span>
          </CardDescription>
          <CardDescription className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {organization.city}, {organization.country}
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-grow text-sm text-muted-foreground pt-0 pb-3">
        <p className="line-clamp-2 mb-2">{organization.address}</p>
        {organization.website && (
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center text-sky-600 hover:underline hover:text-sky-700 break-all"
          >
            <Globe className="mr-1 h-3 w-3 flex-shrink-0" />
            {organization.website
              .replace(/^(https?:\/\/)/, "")
              .replace(/\/$/, "")}
          </a>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t mt-auto">
        <Badge
          variant={
            organization.subscriptionStatus === "ACTIVE"
              ? "success"
              : "secondary"
          } // Assuming you add a 'success' variant
          className="capitalize"
        >
          {organization.subscriptionStatus?.toLowerCase()}
        </Badge>
        {/* Example: Link to a details page */}
        <Link
          href={`/admin/organizations/${organization.slug || organization.id}`}
          passHref
          legacyBehavior
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-accent h-8 px-2"
          >
            View Details <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Add a 'success' variant to your Badge component (e.g., in components/ui/badge.tsx)
// variants: {
//   ...
//   success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-100",
//   ...
// }
