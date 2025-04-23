import { OrganizationDetails, useAppStore, WarehouseDetails } from "./app";

/**
 * Utility functions for organization and warehouse operations
 */
export const appService = {
  /* Organization Functions */

  /**
   * Gets the current organization details
   * @returns {OrganizationDetails | null} The current organization or null if not set
   */
  getOrganization: (): OrganizationDetails | null => {
    return useAppStore.getState().organization;
  },

  /**
   * Sets the organization details
   * @param {OrganizationDetails} org - The organization to set
   */
  setOrganization: (org: OrganizationDetails): void => {
    useAppStore.getState().setOrganization(org);
  },

  /**
   * Clears the organization details
   */
  clearOrganization: (): void => {
    useAppStore.getState().clearOrganization();
  },

  /**
   * Updates specific fields of the organization
   * @param {Partial<OrganizationDetails>} updates - The fields to update
   * @throws {Error} If no organization is set
   */
  updateOrganization: (updates: Partial<OrganizationDetails>): void => {
    const current = useAppStore.getState().organization;
    if (!current) {
      throw new Error("No organization set to update");
    }
    useAppStore.getState().updateOrganization(updates);
  },

  /**
   * Initializes both organization and primary warehouse
   * @param {OrganizationDetails} org - The organization details
   * @param {WarehouseDetails} warehouse - The primary warehouse details
   */
  initializeOrganization: (
    org: OrganizationDetails,
    warehouse: WarehouseDetails
  ): void => {
    useAppStore.getState().setOrganization(org);
    useAppStore.getState().setCurrentWarehouse(warehouse);
  },

  /* Warehouse Functions */

  /**
   * Gets the current warehouse details
   * @returns {WarehouseDetails | null} The current warehouse or null if not set
   */
  getCurrentWarehouse: (): WarehouseDetails | null => {
    return useAppStore.getState().currentWarehouse;
  },

  /**
   * Sets the current warehouse
   * @param {WarehouseDetails} warehouse - The warehouse to set as current
   */
  setCurrentWarehouse: (warehouse: WarehouseDetails): void => {
    useAppStore.getState().setCurrentWarehouse(warehouse);
  },

  /**
   * Clears the current warehouse
   */
  clearCurrentWarehouse: (): void => {
    useAppStore.getState().clearCurrentWarehouse();
  },

  /**
   * Updates specific fields of the current warehouse
   * @param {Partial<WarehouseDetails>} updates - The fields to update
   * @throws {Error} If no current warehouse is set
   */
  updateCurrentWarehouse: (updates: Partial<WarehouseDetails>): void => {
    const current = useAppStore.getState().currentWarehouse;
    if (!current) {
      throw new Error("No current warehouse set to update");
    }
    useAppStore.getState().updateCurrentWarehouse(updates);
  },

  /**
   * Formats the warehouse address for display
   * @param {WarehouseDetails} warehouse - The warehouse to format
   * @returns {string} Formatted address string
   */
  formatWarehouseAddress: (warehouse: WarehouseDetails): string => {
    return `${warehouse.address}, ${warehouse.city}, ${warehouse.state} ${warehouse.postalCode}, ${warehouse.country}`;
  },

  /**
   * Gets the formatted address of the current warehouse
   * @returns {string | null} Formatted address or null if no warehouse set
   */
  getCurrentFormattedAddress: (): string | null => {
    const current = useAppStore.getState().currentWarehouse;
    return current ? appService.formatWarehouseAddress(current) : null;
  },

  /**
   * Validates if both organization and warehouse are set
   * @returns {boolean} True if both are set
   */
  isAppInitialized: (): boolean => {
    const state = useAppStore.getState();
    return state.organization !== null && state.currentWarehouse !== null;
  },

  /**
   * Clears both organization and warehouse (for logout/reset)
   */
  clearAll: (): void => {
    useAppStore.getState().clearOrganization();
    useAppStore.getState().clearCurrentWarehouse();
  },
};
