/**
 * Product API utility functions
 */

/**
 * Add a new product via API
 */
export async function apiAddProduct(formData: FormData) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        error: result.error || 'Failed to add product',
        fieldErrors: result.fieldErrors,
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in apiAddProduct:', error);
    return { error: 'Network error while adding product' };
  }
}

/**
 * Update an existing product via API
 */
export async function apiUpdateProduct(formData: FormData) {
  try {
    const response = await fetch('/api/products', {
      method: 'PUT',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        error: result.error || 'Failed to update product',
        fieldErrors: result.fieldErrors,
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in apiUpdateProduct:', error);
    return { error: 'Network error while updating product' };
  }
} 