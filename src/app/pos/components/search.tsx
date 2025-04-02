"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface SearchBarProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-grow">
      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
      <Input
        type="search"
        placeholder="Search products..."
        className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
