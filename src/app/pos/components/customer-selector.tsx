"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { MockCustomer } from "../lib/mock-data";

interface CustomerSelectorProps {
  customers: MockCustomer[];
  value: number;
  onChange: (id: number) => void;
}

export default function CustomerSelector({
  customers,
  value,
  onChange,
}: CustomerSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
    >
      <SelectTrigger className="w-[220px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-left">
        <User className="h-4 w-4 mr-2 inline-block" />
        <SelectValue placeholder="Select Customer" />
      </SelectTrigger>
      <SelectContent>
        {customers.map((customer) => (
          <SelectItem key={customer.id} value={customer.id.toString()}>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={customer.image_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {customer.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span>{customer.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
