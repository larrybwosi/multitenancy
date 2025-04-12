import { z } from "zod"

// Base schema for warehouse creation
export const createWarehouseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }).optional(),
  manager: z.string().min(2, { message: "Manager name must be at least 2 characters" }).optional(),
  capacity: z.coerce.number().positive({ message: "Capacity must be a positive number" }).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).default("ACTIVE"),
  description: z.string().optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }).optional(),
  phone: z.string().min(5, { message: "Phone must be at least 5 characters" }).optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
})

// Schema for warehouse updates
export const updateWarehouseSchema = createWarehouseSchema.partial()

// Response schema for a single warehouse
export const warehouseResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  capacity: z.number(),
  used: z.number(),
  manager: z.string(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
  productCount: z.number(),
  lastUpdated: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
})

// Response schema for multiple warehouses
export const warehousesResponseSchema = z.object({
  warehouses: z.array(warehouseResponseSchema)
})

// TypeScript types
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>
export type WarehouseResponse = z.infer<typeof warehouseResponseSchema>
export type WarehousesResponse = z.infer<typeof warehousesResponseSchema> 