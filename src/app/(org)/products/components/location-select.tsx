// components/location-select.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryLocation } from "@/prisma/client";

interface LocationSelectProps {
  locations: InventoryLocation[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showType?: boolean;
  includeDefaultOption?: boolean;
}

export function LocationSelect({
  locations,
  value,
  onChange,
  placeholder = "Select location",
  className,
  showType = true,
  includeDefaultOption = true,
}: LocationSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeDefaultOption && (
          <SelectItem value="">Default Location</SelectItem>
        )}
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.name}
            {showType && ` (${location.locationType.toLowerCase()})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
