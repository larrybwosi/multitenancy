/**
 * Organization API utility functions
 */

import { toast } from "sonner";


interface Organization {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

/**
 * Fetches the current organization data
 */
export async function fetchOrganization(): Promise<Organization | null> {
  try {
    const response = await fetch('/api/organizations/current', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

/**
 * Updates the organization with new data
 */
export async function updateOrganization(data: Organization): Promise<Organization | null> {
  try {
    const response = await fetch('/api/organizations/current', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update organization');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      toast("Update failed",{
        description: error.message,
      });
    }
    throw error;
  }
}