interface SourceSaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string;
  stockBatchId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  product: {
    name: string;
    sku: string;
    [key: string]: any;
  };
  variant?: {
    name: string;
    sku: string;
    [key: string]: any;
  };
}

interface SourceSale {
  id: string;
  saleNumber: string;
  customerId: string | null;
  memberId: string;
  saleDate: string | Date;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  locationId: string;
  notes: string;
  cashDrawerId: string | null;
  receiptUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  organizationId: string;
  items: SourceSaleItem[];
  customer: {
    name?: string;
    email?: string;
    [key: string]: any;
  } | null;
  member: {
    id: string;
    user: {
      name: string;
      [key: string]: any;
    };
    [key: string]: any;
  } | null;
  organization: {
    id: string;
    name: string;
    logo?: string;
    [key: string]: any;
  };
}

interface TargetSaleItem {
  product: {
    name: string;
    sku: string;
  };
  variant?: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface TargetSale {
  saleData: {
    saleNumber: string;
    saleDate: string;
    member: {
      user: {
        name: string;
      };
    } | null;
    customer: {
      name: string;
      email: string;
    } | null;
    items: TargetSaleItem[];
    totalAmount: number;
    tax: number;
    discount: number;
    finalAmount: number;
    paymentMethod: string;
  };
  currency: string;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    website: string;
    email: string;
    tagline: string;
    footerMessage: string;
  };
  theme: {
    primary: string;
    secondary: string;
  };
}

/**
 * Transforms a source sale object into the target format
 *
 * @param sourceSale - The source sale object
 * @param businessInfo - Optional business information
 * @param currency - Optional currency symbol (defaults to "$")
 * @param theme - Optional theme colors
 * @returns The transformed sale object in target format
 */
function transformSaleStructure(
  sourceSale: SourceSale,
  businessInfo?: Partial<TargetSale['businessInfo']>,
  currency: string = '$',
  theme?: Partial<TargetSale['theme']>
): TargetSale {
  // Transform items
  const transformedItems: TargetSaleItem[] = sourceSale.items.map(item => {
    const transformedItem: TargetSaleItem = {
      product: {
        name: item.product.name,
        sku: item.product.sku,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount,
    };

    // Add variant if it exists
    if (item.variant) {
      transformedItem.variant = {
        name: item.variant.name,
        sku: item.variant.sku,
      };
    }

    return transformedItem;
  });

  // Default business info
  const defaultBusinessInfo = {
    name: sourceSale.organization.name || 'Business Name',
    address: '123 Main Street, City, Country',
    phone: '(123) 456-7890',
    website: 'www.example.com',
    email: 'contact@example.com',
    tagline: 'Your Trusted Partner',
    footerMessage: 'Thank you for your business!',
  };

  // Default theme
  const defaultTheme = {
    primary: 'blue',
    secondary: 'gray',
  };

  // Create target sale object
  const targetSale: TargetSale = {
    saleData: {
      saleNumber: sourceSale.saleNumber,
      saleDate: new Date(sourceSale.saleDate).toISOString(),
      member: sourceSale.member
        ? {
            user: {
              name: sourceSale.member.user.name,
            },
          }
        : null,
      customer: sourceSale.customer
        ? {
            name: sourceSale.customer.name || 'Guest Customer',
            email: sourceSale.customer.email || 'walk-in@dealio.com',
          }
        : null,
      items: transformedItems,
      totalAmount: sourceSale.totalAmount,
      tax: sourceSale.taxAmount,
      discount: sourceSale.discountAmount,
      finalAmount: sourceSale.finalAmount,
      paymentMethod: sourceSale.paymentMethod,
    },
    currency,
    businessInfo: { ...defaultBusinessInfo, ...(businessInfo || {}) },
    theme: { ...defaultTheme, ...(theme || {}) },
  };

  return targetSale;
}

export default transformSaleStructure;
