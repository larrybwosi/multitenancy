

export const UNIT_OPTIONS = [
  { value: "PIECE", label: "Piece" },
  { value: "DOZEN", label: "Dozen" },
  { value: "PACK", label: "Pack" },
  { value: "BOX", label: "Box" },
  { value: "CASE", label: "Case" },
  { value: "PALLET", label: "Pallet" },
  { value: "KILOGRAM", label: "Kilogram" },
  { value: "GRAM", label: "Gram" },
  { value: "LITER", label: "Liter" },
  { value: "MILLILITER", label: "Milliliter" },
] as const;

// Enhanced Unit Conversion System
interface UnitDefinition {
  code: string;
  name: string;
  symbol: string;
  baseUnit: string; // Reference to the base unit
  conversionFactor: number; // Multiplier to convert to base unit
  type: "volume" | "weight" | "count" | "length" | "area";
  system: "metric" | "imperial" | "custom";
  isBase: boolean;
}

export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Base Units
  PIECE: {
    code: "PIECE",
    name: "Piece",
    symbol: "pc",
    baseUnit: "PIECE",
    conversionFactor: 1,
    type: "count",
    system: "custom",
    isBase: true,
  },
  DOZEN: {
    code: "DOZEN",
    name: "Dozen",
    symbol: "dz",
    baseUnit: "PIECE",
    conversionFactor: 12,
    type: "count",
    system: "custom",
    isBase: true,
  },
  PACK: {
    code: "PACK",
    name: "Pack",
    symbol: "pk",
    baseUnit: "PIECE",
    conversionFactor: 1,
    type: "count",
    system: "custom",
    isBase: true,
  },
  GRAM: {
    code: "GRAM",
    name: "Gram",
    symbol: "g",
    baseUnit: "GRAM",
    conversionFactor: 1,
    type: "weight",
    system: "metric",
    isBase: true,
  },
  METER: {
    code: "METER",
    name: "Meter",
    symbol: "m",
    baseUnit: "METER",
    conversionFactor: 1,
    type: "length",
    system: "metric",
    isBase: true,
  },

  // Derived Units
  KILOGRAM: {
    code: "KILOGRAM",
    name: "Kilogram",
    symbol: "kg",
    baseUnit: "GRAM",
    conversionFactor: 1000,
    type: "weight",
    system: "metric",
    isBase: false,
  },
  POUND: {
    code: "POUND",
    name: "Pound",
    symbol: "lb",
    baseUnit: "GRAM",
    conversionFactor: 453.592,
    type: "weight",
    system: "imperial",
    isBase: false,
  },
  BALE: {
    code: "BALE",
    name: "Bale",
    symbol: "bl",
    baseUnit: "PIECE",
    conversionFactor: 500, // 1 bale = 500 pieces
    type: "count",
    system: "custom",
    isBase: false,
  },
  CASE: {
    code: "CASE",
    name: "Case",
    symbol: "cs",
    baseUnit: "PIECE",
    conversionFactor: 24, // 1 case = 24 pieces
    type: "count",
    system: "custom",
    isBase: false,
  },
  PALLET: {
    code: "PALLET",
    name: "Pallet",
    symbol: "plt",
    baseUnit: "PIECE",
    conversionFactor: 1200, // 1 pallet = 1200 pieces
    type: "count",
    system: "custom",
    isBase: false,
  },
};

// Type for restock units
type RestockUnit = keyof typeof UNIT_DEFINITIONS;

// Enhanced Restock Parameters
export interface RestockProductParams {
  productId: string;
  variantId?: string;
  unit: RestockUnit;
  unitQuantity: number;
  locationId: string;
  supplierId?: string;
  purchaseItemId?: string;
  expiryDate?: Date;
  purchasePrice?: number;
  costPrice?: number;
  retailPrice?: number;
  notes?: string;
  actualDeliveryDate?: Date;
  customsInfo?: {
    hsCode?: string;
    countryOfOrigin?: string;
    importDutyRate?: number;
  };
}


// Batch Number Generator
export function generateBatchNumber(organizationId: string, productId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `BAT-${organizationId.toLocaleLowerCase().slice(3, 6)}-${productId.slice(0, 3)}-${year}${month}${day}-${randomString}`;
}

// Enhanced Unit Conversion Functions
function convertToBaseUnit(quantity: number, unit: RestockUnit): number {
  const unitDef = UNIT_DEFINITIONS[unit];
  if (!unitDef) throw new Error(`Unsupported unit: ${unit}`);
  return quantity * unitDef.conversionFactor;
}

function convertFromBaseUnit(quantity: number, toUnit: RestockUnit): number {
  const unitDef = UNIT_DEFINITIONS[toUnit];
  if (!unitDef) throw new Error(`Unsupported unit: ${toUnit}`);
  return quantity / unitDef.conversionFactor;
}

function areUnitsCompatible(unit1: RestockUnit, unit2: RestockUnit): boolean {
  return UNIT_DEFINITIONS[unit1]?.baseUnit === UNIT_DEFINITIONS[unit2]?.baseUnit;
}

function getUnitDefinition(unit: RestockUnit): UnitDefinition {
  const definition = UNIT_DEFINITIONS[unit];
  if (!definition) throw new Error(`Unknown unit: ${unit}`);
  return definition;
}

export { convertFromBaseUnit, convertToBaseUnit, areUnitsCompatible, getUnitDefinition };