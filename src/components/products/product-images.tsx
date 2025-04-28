"use client"

import { useState, useCallback } from "react"
import { type Control, useFieldArray, useController } from "react-hook-form"
import { ImagePlus, X, Upload, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

interface ProductImagesProps {
  control: Control<any>
  errors: any
}

interface ImageUploadResponse {
  url: string
  id: string
}

export function ProductImages({ control, errors }: ProductImagesProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const { field } = useController({
    name: "imageUrls",
    control,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "imageUrls",
  })

  const handleAddImageUrl = () => {
    if (imageUrl && isValidUrl(imageUrl)) {
      append(imageUrl)
      setImageUrl("")
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      const maxSize = 5 * 1024 * 1024 // 5MB

      // Filter valid files
      const validFiles = acceptedFiles.filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid file type: ${file.name}`, {
            description: "Only JPG, PNG, WebP, and GIF images are allowed.",
          })
          return false
        }

        if (file.size > maxSize) {
          toast.error(`File too large: ${file.name}`, {
            description: "Maximum file size is 5MB.",
          })
          return false
        }

        return true
      })

      if (validFiles.length === 0) return

      setIsUploading(true)

      // Upload each file
      for (const file of validFiles) {
        try {
          // Create unique ID for tracking upload progress
          const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }))

          // Create form data
          const formData = new FormData()
          formData.append("file", file)

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const currentProgress = prev[uploadId] || 0
              if (currentProgress >= 90) {
                clearInterval(progressInterval)
                return prev
              }
              return { ...prev, [uploadId]: currentProgress + 10 }
            })
          }, 300)

          // Upload file
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          clearInterval(progressInterval)

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`)
          }

          const data: ImageUploadResponse = await response.json()

          // Complete progress
          setUploadProgress((prev) => ({ ...prev, [uploadId]: 100 }))

          // Add image URL to form
          append(data.url)

          toast.success(`Uploaded: ${file.name}`)

          // Remove progress after a delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const { [uploadId]: _, ...rest } = prev
              return rest
            })
          }, 1000)
        } catch (error) {
          console.error("Upload error:", error)
          toast.error(`Failed to upload: ${file.name}`, {
            description: error instanceof Error ? error.message : "Unknown error occurred",
          })
        }
      }

      setIsUploading(false)
    },
    [append],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/gif": [],
    },
    disabled: isUploading,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Product Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload images of your product. You can upload multiple images or add image URLs.
        </p>
      </div>

      {/* Dropzone for image uploads */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop images here" : "Drag & drop images here, or click to select files"}
          </p>
          <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP, GIF up to 5MB</p>
        </div>
      </div>

      {/* Upload progress indicators */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Manual URL input */}
      <div className="flex gap-2">
        <Input
          placeholder="Or enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="button" onClick={handleAddImageUrl} disabled={!imageUrl || !isValidUrl(imageUrl)}>
          Add URL
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {fields.map((field, index) => (
          <div key={field.id} className="relative group animate-fade-in">
            <img
              src={field.value || "/placeholder.svg"}
              alt={`Product image ${index + 1}`}
              className="w-full aspect-square object-cover rounded-md border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => remove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {fields.length === 0 && !isUploading && (
          <div className="col-span-full border border-dashed rounded-md flex flex-col items-center justify-center p-6 text-center">
            <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No images added yet</p>
          </div>
        )}
      </div>

      <FormField
        control={control}
        name="imageUrls"
        render={() => (
          <FormItem>
            <FormControl>
              <input type="hidden" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
