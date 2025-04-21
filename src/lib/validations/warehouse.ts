import { z } from "zod";
import { LocationType, MeasurementUnit, StorageUnitType } from "@prisma/client";

// --- InventoryLocation Schemas ---

// Base schema for common InventoryLocation fields
const inventoryLocationBaseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().nullish(), // Allow null or undefined
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  locationType: z.nativeEnum(LocationType).default(LocationType.RETAIL_SHOP), // Default from model
  address: z
    .string()
    .min(5, "Address should be at least 5 characters")
    .nullish(),
  capacityTracking: z.boolean().default(false),
  totalCapacity: z
    .number()
    .positive("Capacity must be a positive number")
    .nullish(),
  capacityUnit: z.nativeEnum(MeasurementUnit).nullish(),
  parentLocationId: z
    .string()
    .cuid({ message: "Invalid Parent Location ID format" })
    .nullish(),
  customFields: z.record(z.string(), z.unknown()).nullish(), // Allow any JSON structure
  managerId: z
    .string()
    .cuid({ message: "Invalid Manager ID format" })
    .nullable()
    .optional(),
});

// Schema for creating a new InventoryLocation
export const createInventoryLocationSchema = inventoryLocationBaseSchema.refine(
  (data) => {
    if (data.totalCapacity !== null && data.totalCapacity !== undefined) {
      return data.capacityUnit !== null && data.capacityUnit !== undefined;
    }
    return true; // If totalCapacity is not set, capacityUnit doesn't matter
  },
  {
    message: "Capacity Unit is required when Total Capacity is provided.",
    path: ["capacityUnit"], // Path of the error
  }
);

// Schema for updating an existing InventoryLocation (all fields optional)
export const updateInventoryLocationSchema = inventoryLocationBaseSchema
  .partial()
  .refine(
    (data) => {
      if (data.totalCapacity !== null && data.totalCapacity !== undefined) {
        return data.capacityUnit !== null && data.capacityUnit !== undefined;
      }
      return true;
    },
    {
      message: "Capacity Unit is required when Total Capacity is provided.",
      path: ["capacityUnit"],
    }
  );

// --- StorageZone Schemas ---

// Base schema for common StorageZone fields
const storageZoneBaseSchema = z.object({
  name: z.string().min(1, { message: "Zone name cannot be empty" }),
  description: z.string().nullish(),
  locationId: z.string().cuid({ message: "Invalid Location ID format" }), // Required relation
  capacity: z.number().positive("Capacity must be a positive number").nullish(),
  capacityUnit: z.nativeEnum(MeasurementUnit).nullish(),
  isActive: z.boolean().default(true),
  customFields: z.record(z.string(), z.unknown()).nullish(),
  // Note: organizationId is typically added server-side
});

// Schema for creating a new StorageZone
export const createStorageZoneSchema = storageZoneBaseSchema.refine(
  (data) => {
    if (data.capacity !== null && data.capacity !== undefined) {
      return data.capacityUnit !== null && data.capacityUnit !== undefined;
    }
    return true;
  },
  {
    message: "Capacity Unit is required when Capacity is provided.",
    path: ["capacityUnit"],
  }
);

// Schema for updating an existing StorageZone
export const updateStorageZoneSchema = storageZoneBaseSchema
  .partial()
  .extend({
    locationId: z
      .string()
      .cuid({ message: "Invalid Location ID format" })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.capacity !== null && data.capacity !== undefined) {
        return data.capacityUnit !== null && data.capacityUnit !== undefined;
      }
      return true;
    },
    {
      message: "Capacity Unit is required when Capacity is provided.",
      path: ["capacityUnit"],
    }
  );

// --- StorageUnit Schemas ---

// Base schema for common StorageUnit fields
const storageUnitBaseSchema = z.object({
  name: z.string().min(1, { message: "Unit name cannot be empty" }),
  reference: z.string().nullish(), // Barcode or external ref
  unitType: z.nativeEnum(StorageUnitType), // Required
  locationId: z.string().cuid({ message: "Invalid Location ID format" }), // Required relation
  zoneId: z.string().cuid({ message: "Invalid Zone ID format" }).nullish(), // Optional relation
  width: z.number().positive("Width must be positive").nullish(),
  height: z.number().positive("Height must be positive").nullish(),
  depth: z.number().positive("Depth must be positive").nullish(),
  dimensionUnit: z.string().min(1, "Dimension unit cannot be empty").nullish(), // e.g., "cm", "in"
  maxWeight: z.number().positive("Max Weight must be positive").nullish(),
  weightUnit: z.string().min(1, "Weight unit cannot be empty").nullish(), // e.g., "kg", "lb"
  capacity: z.number().positive("Capacity must be positive").nullish(),
  capacityUnit: z.nativeEnum(MeasurementUnit).nullish(),
  isActive: z.boolean().default(true),
  position: z.string().nullish(), // Physical position reference
  customFields: z.record(z.string(), z.unknown()).nullish(),
  // Note: organizationId is typically added server-side
});

// Schema for creating a new StorageUnit
export const createStorageUnitSchema = storageUnitBaseSchema
  .refine(
    (data) => {
      if (data.width !== null || data.height !== null || data.depth !== null) {
        return (
          data.dimensionUnit !== null &&
          data.dimensionUnit !== undefined &&
          data.dimensionUnit.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Dimension Unit is required if width, height, or depth is provided.",
      path: ["dimensionUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.maxWeight !== null && data.maxWeight !== undefined) {
        return (
          data.weightUnit !== null &&
          data.weightUnit !== undefined &&
          data.weightUnit.length > 0
        );
      }
      return true;
    },
    {
      message: "Weight Unit is required if Max Weight is provided.",
      path: ["weightUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.capacity !== null && data.capacity !== undefined) {
        return data.capacityUnit !== null && data.capacityUnit !== undefined;
      }
      return true;
    },
    {
      message: "Capacity Unit is required when Capacity is provided.",
      path: ["capacityUnit"],
    }
  );

// Schema for updating an existing StorageUnit
export const updateStorageUnitSchema = storageUnitBaseSchema
  .partial()
  .extend({
    locationId: z
      .string()
      .cuid({ message: "Invalid Location ID format" })
      .optional(),
    zoneId: z.string().cuid({ message: "Invalid Zone ID format" }).nullish(),
  })
  .refine(
    (data) => {
      if (data.width !== null || data.height !== null || data.depth !== null) {
        return (
          data.dimensionUnit !== null &&
          data.dimensionUnit !== undefined &&
          data.dimensionUnit.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Dimension Unit is required if width, height, or depth is provided.",
      path: ["dimensionUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.maxWeight !== null && data.maxWeight !== undefined) {
        return (
          data.weightUnit !== null &&
          data.weightUnit !== undefined &&
          data.weightUnit.length > 0
        );
      }
      return true;
    },
    {
      message: "Weight Unit is required if Max Weight is provided.",
      path: ["weightUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.capacity !== null && data.capacity !== undefined) {
        return data.capacityUnit !== null && data.capacityUnit !== undefined;
      }
      return true;
    },
    {
      message: "Capacity Unit is required when Capacity is provided.",
      path: ["capacityUnit"],
    }
  );

// --- StoragePosition Schemas ---

// Base schema for common StoragePosition fields
const storagePositionBaseSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Position identifier cannot be empty" }), // e.g., "A1-L2-P3"
  storageUnitId: z.string().cuid({ message: "Invalid Storage Unit ID format" }), // Required relation
  width: z.number().positive("Width must be positive").nullish(),
  height: z.number().positive("Height must be positive").nullish(),
  depth: z.number().positive("Depth must be positive").nullish(),
  dimensionUnit: z.string().min(1, "Dimension unit cannot be empty").nullish(),
  maxWeight: z.number().positive("Max Weight must be positive").nullish(),
  weightUnit: z.string().min(1, "Weight unit cannot be empty").nullish(),
  isOccupied: z.boolean().default(false), // Can likely be set directly?
  customFields: z.record(z.string(), z.unknown()).nullish(),
  // Note: organizationId is typically added server-side
});

// Schema for creating a new StoragePosition
export const createStoragePositionSchema = storagePositionBaseSchema
  .refine(
    (data) => {
      if (data.width !== null || data.height !== null || data.depth !== null) {
        return (
          data.dimensionUnit !== null &&
          data.dimensionUnit !== undefined &&
          data.dimensionUnit.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Dimension Unit is required if width, height, or depth is provided.",
      path: ["dimensionUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.maxWeight !== null && data.maxWeight !== undefined) {
        return (
          data.weightUnit !== null &&
          data.weightUnit !== undefined &&
          data.weightUnit.length > 0
        );
      }
      return true;
    },
    {
      message: "Weight Unit is required if Max Weight is provided.",
      path: ["weightUnit"],
    }
  );

// Schema for updating an existing StoragePosition
export const updateStoragePositionSchema = storagePositionBaseSchema
  .partial()
  .extend({
    storageUnitId: z
      .string()
      .cuid({ message: "Invalid Storage Unit ID format" })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.width !== null || data.height !== null || data.depth !== null) {
        return (
          data.dimensionUnit !== null &&
          data.dimensionUnit !== undefined &&
          data.dimensionUnit.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Dimension Unit is required if width, height, or depth is provided.",
      path: ["dimensionUnit"],
    }
  )
  .refine(
    (data) => {
      if (data.maxWeight !== null && data.maxWeight !== undefined) {
        return (
          data.weightUnit !== null &&
          data.weightUnit !== undefined &&
          data.weightUnit.length > 0
        );
      }
      return true;
    },
    {
      message: "Weight Unit is required if Max Weight is provided.",
      path: ["weightUnit"],
    }
  );
