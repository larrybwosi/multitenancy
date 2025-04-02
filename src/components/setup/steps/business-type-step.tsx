"use client";

import { useState } from "react";
import {
  Coffee,
  ShoppingBag,
  Utensils,
  Shirt,
  Scissors,
  Pill,
  BookOpen,
  Wrench,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessType } from "../setup-wizard";

const businessTypes: BusinessType[] = [
  {
    id: "retail",
    name: "Retail Store",
    description: "General merchandise, clothing, electronics, etc.",
    icon: <ShoppingBag className="h-8 w-8" />,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "restaurant",
    name: "Restaurant/Café",
    description: "Food service, cafés, bars, etc.",
    icon: <Utensils className="h-8 w-8" />,
    color: "bg-red-50 text-red-600",
  },
  {
    id: "coffee-shop",
    name: "Coffee Shop",
    description: "Coffee, tea, pastries, etc.",
    icon: <Coffee className="h-8 w-8" />,
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "fashion",
    name: "Fashion & Apparel",
    description: "Clothing, accessories, footwear, etc.",
    icon: <Shirt className="h-8 w-8" />,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    id: "salon",
    name: "Salon & Spa",
    description: "Hair salon, beauty spa, barber shop, etc.",
    icon: <Scissors className="h-8 w-8" />,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    description: "Medications, health products, etc.",
    icon: <Pill className="h-8 w-8" />,
    color: "bg-green-50 text-green-600",
  },
  {
    id: "bookstore",
    name: "Bookstore",
    description: "Books, stationery, gifts, etc.",
    icon: <BookOpen className="h-8 w-8" />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "hardware",
    name: "Hardware Store",
    description: "Tools, building materials, home improvement, etc.",
    icon: <Wrench className="h-8 w-8" />,
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "custom",
    name: "Custom Business",
    description: "Define your own business type",
    icon: <Plus className="h-8 w-8" />,
    color: "bg-gray-50 text-gray-600",
  },
];

interface BusinessTypeStepProps {
  selectedType: BusinessType | null;
  onSelect: (type: BusinessType) => void;
}

export function BusinessTypeStep({
  selectedType,
  onSelect,
}: BusinessTypeStepProps) {
  const [customType, setCustomType] = useState({
    id: "custom",
    name: "",
    description: "",
  });

  const handleCustomTypeChange = (
    field: keyof typeof customType,
    value: string
  ) => {
    setCustomType({
      ...customType,
      [field]: value,
    });

    if (selectedType?.id === "custom") {
      onSelect({
        ...customType,
        [field]: value,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Select Your Business Type
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Choose the type of business you operate. This will help us customize
          your POS experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {businessTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 overflow-hidden ${
              selectedType?.id === type.id
                ? "ring-2 ring-primary shadow-md"
                : "shadow-sm"
            }`}
            onClick={() => onSelect(type)}
          >
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div
                className={`p-3 rounded-full ${type?.color?.replace("text", "bg")} ${selectedType?.id === type.id ? "scale-110" : ""} transition-transform`}
              >
                {type.icon}
              </div>
              <h3 className="font-semibold text-gray-800">{type.name}</h3>
              <p className="text-sm text-gray-500">{type.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType?.id === "custom" && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 space-y-5 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-800">
            Custom Business Details
          </h3>

          <div className="space-y-3">
            <Label htmlFor="custom-name" className="text-gray-700">
              Business Type Name
            </Label>
            <Input
              id="custom-name"
              value={customType.name}
              onChange={(e) => handleCustomTypeChange("name", e.target.value)}
              placeholder="e.g., Art Gallery, Pet Shop"
              className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="custom-description" className="text-gray-700">
              Brief Description
            </Label>
            <Input
              id="custom-description"
              value={customType.description}
              onChange={(e) =>
                handleCustomTypeChange("description", e.target.value)
              }
              placeholder="Describe your business type"
              className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
