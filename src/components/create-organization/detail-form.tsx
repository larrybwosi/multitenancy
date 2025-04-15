"use client"

import type React from "react"

import { useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, UploadCloud } from "lucide-react"
import { uploadSanityAsset } from "@/actions/uploads"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


interface OrganizationState {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null; // Added for logo
  defaultCurrency: string;
  defaultTimezone: string;
  defaultTaxRate: number | string; // Allow string for input control
  inventoryPolicy: "FIFO" | "LIFO" | "FEFO";
  lowStockThreshold: number | string; // Allow string for input control
  negativeStock: boolean;
}


interface DetailFormProps {
  organization: OrganizationState
  setOrganization: React.Dispatch<React.SetStateAction<OrganizationState>>
}

export function DetailForm({ organization, setOrganization }: DetailFormProps) {
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOrganizationChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined

    setOrganization((prev) => {
      const newState = {
        ...prev,
        [name]: isCheckbox ? checked : value,
      }

      // Auto-generate slug from name, only if slug is empty or directly derived
      if (
        name === "name" &&
        (prev.slug === "" ||
          prev.slug ===
            prev.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""))
      ) {
        newState.slug = value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      }
      return newState
    })
  }


const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Show uploading toast with loading state
  const toastId = toast.loading("Uploading logo...");
  setUploadingLogo(true);
  
  try {
    //@ts-expect-error this is fine
    const imageUrl = await uploadSanityAsset(file, `${organization.slug}-logo`, "image");
    
    setOrganization((prev) => ({ ...prev, logoUrl: imageUrl }));
    
    // Update toast to success state
    toast.success("Logo uploaded successfully!", {
      id: toastId,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    setOrganization((prev) => ({ ...prev, logoUrl: null }));
    
    // Update toast to error state
    toast.error("Failed to upload logo", {
      id: toastId,
      description: error instanceof Error ? error.message : "Please try again",
    });
  } finally {
    setUploadingLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-orange-200 bg-orange-50/50 transition-all hover:bg-orange-50">
        <div className="mb-4">
          {organization.logoUrl ? (
            <div className="relative h-28 w-28 rounded-xl overflow-hidden shadow-lg border-2 border-orange-200">
              <Image
                src={organization.logoUrl || "/placeholder.svg"}
                alt="Organization Logo"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-28 w-28 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shadow-md border border-orange-200">
              <ImageIcon className="h-14 w-14 text-orange-300" />
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          id="logo-upload"
          disabled={uploadingLogo}
        />

        <Label htmlFor="logo-upload" className="cursor-pointer">
          <Button
            variant="outline"
            type="button"
            disabled={uploadingLogo}
            className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-900"
          >
            {uploadingLogo ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>{organization.logoUrl ? "Change Logo" : "Upload Logo"}</span>
              </>
            )}
          </Button>
        </Label>

        <p className="mt-2 text-xs text-orange-600 text-center">
          Upload a logo (PNG, JPG, WEBP, SVG). Max 2MB recommended.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="name" className="text-orange-900">
            Organization Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={organization.name}
            onChange={handleOrganizationChange}
            placeholder="e.g., Acme Corporation"
            required
            className="border-orange-200 focus-visible:ring-orange-500"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="slug" className="text-orange-900">
            URL Slug <span className="text-red-500">*</span>
          </Label>
          <div className="flex rounded-md">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-orange-200 bg-orange-50 text-orange-700 text-sm">
              dealio.io/org/
            </span>
            <Input
              id="slug"
              name="slug"
              value={organization.slug}
              onChange={handleOrganizationChange}
              className="rounded-l-none border-orange-200 focus-visible:ring-orange-500"
              placeholder="e.g., acme-corp"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              required
            />
          </div>
          <p className="text-xs text-orange-600">
            Unique URL identifier. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="description" className="text-orange-900">
            Business Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={organization.description}
            onChange={handleOrganizationChange}
            placeholder="Describe your business activities, products, or services."
            rows={4}
            className="border-orange-200 focus-visible:ring-orange-500"
          />
          <p className="text-xs text-orange-600">Provide enough detail for accurate category generation.</p>
        </div>
      </div>
    </div>
  )
}

export default DetailForm
