import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Represents organization details
 * @interface OrganizationDetails
 * @property {string} id - Unique identifier for the organization
 * @property {string} name - Name of the organization
 * @property {string} slug - URL-friendly identifier
 * @property {string} [logo] - URL to organization logo (optional)
 */
export interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tax?:number
}

/**
 * Represents warehouse details
 * @interface WarehouseDetails
 * @property {string} id - Unique identifier for the warehouse
 * @property {string} name - Name of the warehouse
 * @property {string} address - Street address
 * @property {string} city - City
 * @property {string} state - State/Province
 * @property {string} country - Country
 * @property {string} postalCode - Postal/ZIP code
 * @property {string} contactPhone - Contact phone number
 * @property {string} contactEmail - Contact email address
 * @property {boolean} isPrimary - Whether this is the primary warehouse
 */
export interface WarehouseDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactPhone: string;
  contactEmail: string;
  isPrimary: boolean;
}

interface AppState {
  organization: OrganizationDetails | null;
  currentWarehouse: WarehouseDetails | null;

  /**
   * Sets the organization details
   * @param {OrganizationDetails} org - The organization details to set
   */
  setOrganization: (org: OrganizationDetails) => void;

  /**
   * Clears the organization details
   */
  clearOrganization: () => void;

  /**
   * Updates specific fields of the organization
   * @param {Partial<OrganizationDetails>} updates - The fields to update
   */
  updateOrganization: (updates: Partial<OrganizationDetails>) => void;

  /**
   * Sets the current warehouse
   * @param {WarehouseDetails} warehouse - The warehouse details to set as current
   */
  setCurrentWarehouse: (warehouse: WarehouseDetails) => void;

  /**
   * Clears the current warehouse (sets to null)
   */
  clearCurrentWarehouse: () => void;

  /**
   * Updates specific fields of the current warehouse
   * @param {Partial<WarehouseDetails>} updates - The fields to update
   */
  updateCurrentWarehouse: (updates: Partial<WarehouseDetails>) => void;

  /**
   * Clears all app state (organization and warehouse) - typically used when signing out
   */
  clearAll: () => void;
}

/**
 * Zustand store for managing organization and warehouse state
 */
export const useAppStore = create<AppState>()(
  persist(
    set => ({
      organization: null,
      currentWarehouse: null,

      setOrganization: org => set({ organization: org }),
      clearOrganization: () => set({ organization: null }),
      updateOrganization: updates =>
        set(state => ({
          organization: state.organization ? { ...state.organization, ...updates } : null,
        })),

      setCurrentWarehouse: warehouse => set({ currentWarehouse: warehouse }),
      clearCurrentWarehouse: () => set({ currentWarehouse: null }),
      updateCurrentWarehouse: updates =>
        set(state => ({
          currentWarehouse: state.currentWarehouse ? { ...state.currentWarehouse, ...updates } : null,
        })),
      clearAll: () => set({ organization: null, currentWarehouse: null }),
    }),
    {
      name: 'app-storage',
      // Optional: Only persist specific fields
      // partialize: (state) => ({
      //   organization: state.organization,
      //   currentWarehouse: state.currentWarehouse
      // }),
    }
  )
);

export function useStore (){
  const org = useAppStore((o)=>o.organization)
  return org;
}