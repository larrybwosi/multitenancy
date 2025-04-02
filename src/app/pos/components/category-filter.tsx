"use client";

import { Button } from "@/components/ui/button";
import { MockCategory } from "../lib/mock-data";

interface CategoryFiltersProps {
  categories: MockCategory[];
  selectedCategoryId: number;
  onSelectCategory: (id: number) => void;
}

export default function CategoryFilters({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFiltersProps) {
  return (
    <div className="flex space-x-3 mb-6 overflow-x-auto pb-2">
      <Button
        variant={selectedCategoryId === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(0)}
        className="flex-shrink-0 rounded-md"
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategoryId === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="flex-shrink-0 rounded-md"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
