

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


/**
 * Represents the structure for defining units and their conversion properties.
 */
interface UnitDefinition {
  code: string;
  name: string;
  symbol: string;
  baseUnit: string;
  conversionFactor: number;
  type: 'volume' | 'weight' | 'count' | 'length' | 'area';
  system: 'metric' | 'imperial' | 'custom';
  isBase: boolean;
}

/**
 * A comprehensive record of unit definitions tailored for retail/wholesale.
 * IMPORTANT: For units like PACK, BOX, CASE, CRATE, BUNDLE where the count can vary
 * significantly by product, the conversionFactor here is a *default* or common *example*.
 * It's often necessary to store product-specific conversion factors if these units
 * are used for inventory tracking with variable contents.
 */
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // === BASE UNITS ===
  PIECE:        { code: 'PIECE',        name: 'Piece',         symbol: 'pc',  baseUnit: 'PIECE', conversionFactor: 1,    type: 'count',   system: 'custom', isBase: true },
  GRAM:         { code: 'GRAM',         name: 'Gram',          symbol: 'g',   baseUnit: 'GRAM',  conversionFactor: 1,    type: 'weight',  system: 'metric', isBase: true },
  MILLILITER:   { code: 'MILLILITER',   name: 'Milliliter',    symbol: 'mL',  baseUnit: 'MILLILITER', conversionFactor: 1, type: 'volume',  system: 'metric', isBase: true }, // Using mL as base for volume often simpler
  METER:        { code: 'METER',        name: 'Meter',         symbol: 'm',   baseUnit: 'METER', conversionFactor: 1,    type: 'length',  system: 'metric', isBase: true }, // For items sold by length
  SQUARE_METER: { code: 'SQUARE_METER', name: 'Square Meter',  symbol: 'm²',  baseUnit: 'SQUARE_METER', conversionFactor: 1, type: 'area', system: 'metric', isBase: true }, // For items sold by area

  // === COUNT UNITS ===
  EACH:         { code: 'EACH',         name: 'Each',          symbol: 'ea',  baseUnit: 'PIECE', conversionFactor: 1,    type: 'count',   system: 'custom', isBase: false }, // Synonym for PIECE
  PAIR:         { code: 'PAIR',         name: 'Pair',          symbol: 'pr',  baseUnit: 'PIECE', conversionFactor: 2,    type: 'count',   system: 'custom', isBase: false }, // e.g., Shoes, Gloves
  DOZEN:        { code: 'DOZEN',        name: 'Dozen',         symbol: 'dz',  baseUnit: 'PIECE', conversionFactor: 12,   type: 'count',   system: 'custom', isBase: false }, // e.g., Eggs, Bakery
  SIX_PACK:     { code: 'SIX_PACK',     name: 'Six-Pack',      symbol: '6pk', baseUnit: 'PIECE', conversionFactor: 6,    type: 'count',   system: 'custom', isBase: false }, // e.g., Drinks
  PACK:         { code: 'PACK',         name: 'Pack',          symbol: 'pk',  baseUnit: 'PIECE', conversionFactor: 1,    type: 'count',   system: 'custom', isBase: false }, // Highly variable - Placeholder
  BOX:          { code: 'BOX',          name: 'Box',           symbol: 'box', baseUnit: 'PIECE', conversionFactor: 1,    type: 'count',   system: 'custom', isBase: false }, // Highly variable - Placeholder
  CASE:         { code: 'CASE',         name: 'Case',          symbol: 'cs',  baseUnit: 'PIECE', conversionFactor: 12,   type: 'count',   system: 'custom', isBase: false }, // Example: 12 or 24 common
  BUNDLE:       { code: 'BUNDLE',       name: 'Bundle',        symbol: 'bdl', baseUnit: 'PIECE', conversionFactor: 10,   type: 'count',   system: 'custom', isBase: false }, // Example: Firewood, Newspapers
  CRATE:        { code: 'CRATE',        name: 'Crate',         symbol: 'cr',  baseUnit: 'PIECE', conversionFactor: 24,   type: 'count',   system: 'custom', isBase: false }, // Example: Soda/Beer bottles
  REAM:         { code: 'REAM',         name: 'Ream',          symbol: 'rm',  baseUnit: 'PIECE', conversionFactor: 500,  type: 'count',   system: 'custom', isBase: false }, // Paper
  ROLL:         { code: 'ROLL',         name: 'Roll',          symbol: 'rl',  baseUnit: 'PIECE', conversionFactor: 1,    type: 'count',   system: 'custom', isBase: false }, // Used when the roll is the unit

  // === WEIGHT UNITS ===
  KILOGRAM:     { code: 'KILOGRAM',     name: 'Kilogram',      symbol: 'kg',  baseUnit: 'GRAM',  conversionFactor: 1000, type: 'weight',  system: 'metric', isBase: false }, // Common for produce, bulk goods
  POUND:        { code: 'POUND',        name: 'Pound',         symbol: 'lb',  baseUnit: 'GRAM',  conversionFactor: 453.592, type: 'weight', system: 'imperial', isBase: false }, // Used in some regions/imports
  OUNCE_WEIGHT: { code: 'OUNCE_WEIGHT', name: 'Ounce (Weight)',symbol: 'oz',  baseUnit: 'GRAM',  conversionFactor: 28.3495, type: 'weight', system: 'imperial', isBase: false }, // Less common for direct sale, maybe ingredients

  // === VOLUME UNITS ===
  LITER:        { code: 'LITER',        name: 'Liter',         symbol: 'L',   baseUnit: 'MILLILITER', conversionFactor: 1000, type: 'volume', system: 'metric', isBase: false }, // Drinks, Liquids
  GALLON:       { code: 'GALLON',       name: 'Gallon (US)',   symbol: 'gal', baseUnit: 'MILLILITER', conversionFactor: 3785.41, type: 'volume', system: 'imperial', isBase: false }, // Larger liquids, cleaning supplies
  QUART:        { code: 'QUART',        name: 'Quart (US)',    symbol: 'qt',  baseUnit: 'MILLILITER', conversionFactor: 946.353,  type: 'volume', system: 'imperial', isBase: false }, // Milk, Juice
  PINT:         { code: 'PINT',         name: 'Pint (US)',     symbol: 'pt',  baseUnit: 'MILLILITER', conversionFactor: 473.176,  type: 'volume', system: 'imperial', isBase: false }, // Cream, Ice cream
  FLUID_OUNCE:  { code: 'FLUID_OUNCE',  name: 'Fluid Ounce (US)', symbol: 'fl oz', baseUnit: 'MILLILITER', conversionFactor: 29.5735, type: 'volume', system: 'imperial', isBase: false }, // Smaller liquids

  // === LENGTH UNITS === (Less common in supermarket, more in hardware/fabric retail)
  CENTIMETER:   { code: 'CENTIMETER',   name: 'Centimeter',    symbol: 'cm',  baseUnit: 'METER', conversionFactor: 0.01, type: 'length',  system: 'metric', isBase: false },
  INCH:         { code: 'INCH',         name: 'Inch',          symbol: 'in',  baseUnit: 'METER', conversionFactor: 0.0254, type: 'length', system: 'imperial', isBase: false },
  FOOT:         { code: 'FOOT',         name: 'Foot',          symbol: 'ft',  baseUnit: 'METER', conversionFactor: 0.3048, type: 'length', system: 'imperial', isBase: false },
  YARD:         { code: 'YARD',         name: 'Yard',          symbol: 'yd',  baseUnit: 'METER', conversionFactor: 0.9144, type: 'length', system: 'imperial', isBase: false }, // Fabric

  // === AREA UNITS === (Less common, e.g., flooring, turf)
  SQUARE_FOOT:  { code: 'SQUARE_FOOT',  name: 'Square Foot',   symbol: 'ft²', baseUnit: 'SQUARE_METER', conversionFactor: 0.092903, type: 'area', system: 'imperial', isBase: false },
};


/**
 * Type representing valid unit codes based on the keys of UNIT_DEFINITIONS.
 */
export type InventoryUnit = keyof typeof UNIT_DEFINITIONS;

/**
 * Options for UI dropdowns, reflecting the tailored retail units.
 */
export const RETAIL_UNIT_OPTIONS = Object.values(UNIT_DEFINITIONS).map(def => ({
  value: def.code,
  label: `${def.name} (${def.symbol})`
}));


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
export function generateBatchNumber( productId: string, variantId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `BATCH-${productId.slice(0, 3)}-${variantId.slice(0, 3)}-${year}${month}${day}-${randomString}`;
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