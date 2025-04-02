"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessDetails } from "../setup-wizard";

interface BusinessDetailsStepProps {
  businessDetails: BusinessDetails;
  onChange: (details: BusinessDetails) => void;
}

export function BusinessDetailsStep({
  businessDetails,
  onChange,
}: BusinessDetailsStepProps) {
  const handleChange = (field: keyof BusinessDetails, value: string) => {
    onChange({
      ...businessDetails,
      [field]: value,
    });
  };

  return (
    <div className="max-w-[1500px] mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Business Details
        </h2>
        <p className="text-gray-500">
          Enter your business information. This will be used on receipts and
          reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label
            htmlFor="business-name"
            className="text-gray-700 font-medium flex items-center"
          >
            Business Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-name"
            value={businessDetails.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Your Business Name"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* Business Email */}
        <div className="space-y-2">
          <Label
            htmlFor="business-email"
            className="text-gray-700 font-medium flex items-center"
          >
            Business Email <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-email"
            type="email"
            value={businessDetails.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label
            htmlFor="business-phone"
            className="text-gray-700 font-medium flex items-center"
          >
            Phone Number <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-phone"
            value={businessDetails.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label
            htmlFor="business-website"
            className="text-gray-700 font-medium"
          >
            Website (Optional)
          </Label>
          <Input
            id="business-website"
            value={businessDetails.website}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://www.example.com"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label
            htmlFor="business-address"
            className="text-gray-700 font-medium flex items-center"
          >
            Street Address <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-address"
            value={businessDetails.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="123 Main St"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label
            htmlFor="business-city"
            className="text-gray-700 font-medium flex items-center"
          >
            City <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-city"
            value={businessDetails.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="City"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label
            htmlFor="business-state"
            className="text-gray-700 font-medium flex items-center"
          >
            State/Province <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-state"
            value={businessDetails.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="State"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label
            htmlFor="business-zip"
            className="text-gray-700 font-medium flex items-center"
          >
            ZIP/Postal Code <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-zip"
            value={businessDetails.zipCode}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            placeholder="12345"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label
            htmlFor="business-country"
            className="text-gray-700 font-medium flex items-center"
          >
            Country <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="business-country"
            value={businessDetails.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="Country"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
            required
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-2">
          <Label
            htmlFor="business-tax-id"
            className="text-gray-700 font-medium"
          >
            Tax ID (Optional)
          </Label>
          <Input
            id="business-tax-id"
            value={businessDetails.taxId}
            onChange={(e) => handleChange("taxId", e.target.value)}
            placeholder="Tax ID / VAT Number"
            className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6 flex items-center">
        <span className="text-red-500 mr-1">*</span> Indicates required fields
      </p>
    </div>
  );
}
