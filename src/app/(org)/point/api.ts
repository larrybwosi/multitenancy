// types/product.ts
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  priceModifier: number;
  attributes: Record<string, string>; // { "color": "Red", "size": "Large" }
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  basePrice: number;
  reorderPoint: number;
  isActive: boolean;
  imageUrls: string[];
  variants: ProductVariant[];
}

// Mock product data for demo purposes
export const getMockProducts = (): Product[] => {
  return [
    {
      id: "1",
      name: "Modern Desk Lamp",
      description: "A sleek and modern desk lamp with adjustable brightness",
      sku: "LAMP-001",
      barcode: "123456789",
      categoryId: "cat-1",
      basePrice: 59.99,
      reorderPoint: 5,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v1",
          productId: "1",
          name: "Black",
          sku: "LAMP-001-BLK",
          priceModifier: 0,
          attributes: { color: "Black" },
          isActive: true,
        },
        {
          id: "v2",
          productId: "1",
          name: "White",
          sku: "LAMP-001-WHT",
          priceModifier: 0,
          attributes: { color: "White" },
          isActive: true,
        },
        {
          id: "v3",
          productId: "1",
          name: "Gold",
          sku: "LAMP-001-GLD",
          priceModifier: 10,
          attributes: { color: "Gold" },
          isActive: true,
        },
      ],
    },
    {
      id: "2",
      name: "Ergonomic Office Chair",
      description: "Comfortable office chair with lumbar support",
      sku: "CHAIR-001",
      categoryId: "cat-2",
      basePrice: 199.99,
      reorderPoint: 3,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v4",
          productId: "2",
          name: "Black, Mesh",
          sku: "CHAIR-001-BLK-MSH",
          priceModifier: 0,
          attributes: { color: "Black", material: "Mesh" },
          isActive: true,
        },
        {
          id: "v5",
          productId: "2",
          name: "Gray, Fabric",
          sku: "CHAIR-001-GRY-FAB",
          priceModifier: 15,
          attributes: { color: "Gray", material: "Fabric" },
          isActive: true,
        },
      ],
    },
    {
      id: "3",
      name: "Wireless Headphones",
      description: "Premium noise-cancelling wireless headphones",
      sku: "HDPHN-001",
      barcode: "987654321",
      categoryId: "cat-3",
      basePrice: 149.99,
      reorderPoint: 10,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v6",
          productId: "3",
          name: "Black",
          sku: "HDPHN-001-BLK",
          priceModifier: 0,
          attributes: { color: "Black" },
          isActive: true,
        },
        {
          id: "v7",
          productId: "3",
          name: "White",
          sku: "HDPHN-001-WHT",
          priceModifier: 0,
          attributes: { color: "White" },
          isActive: true,
        },
        {
          id: "v8",
          productId: "3",
          name: "Rose Gold",
          sku: "HDPHN-001-RSG",
          priceModifier: 20,
          attributes: { color: "Rose Gold" },
          isActive: true,
        },
      ],
    },
    {
      id: "4",
      name: "Ceramic Coffee Mug",
      description: "12oz ceramic coffee mug with minimalist design",
      sku: "MUG-001",
      categoryId: "cat-4",
      basePrice: 14.99,
      reorderPoint: 20,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v9",
          productId: "4",
          name: "Black",
          sku: "MUG-001-BLK",
          priceModifier: 0,
          attributes: { color: "Black" },
          isActive: true,
        },
        {
          id: "v10",
          productId: "4",
          name: "White",
          sku: "MUG-001-WHT",
          priceModifier: 0,
          attributes: { color: "White" },
          isActive: true,
        },
        {
          id: "v11",
          productId: "4",
          name: "Navy",
          sku: "MUG-001-NVY",
          priceModifier: 0,
          attributes: { color: "Navy" },
          isActive: true,
        },
        {
          id: "v12",
          productId: "4",
          name: "Sage",
          sku: "MUG-001-SGE",
          priceModifier: 2,
          attributes: { color: "Sage" },
          isActive: true,
        },
      ],
    },
    {
      id: "5",
      name: "Leather Wallet",
      description: "Genuine leather wallet with RFID protection",
      sku: "WLLT-001",
      categoryId: "cat-5",
      basePrice: 39.99,
      reorderPoint: 8,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v13",
          productId: "5",
          name: "Brown",
          sku: "WLLT-001-BRN",
          priceModifier: 0,
          attributes: { color: "Brown" },
          isActive: true,
        },
        {
          id: "v14",
          productId: "5",
          name: "Black",
          sku: "WLLT-001-BLK",
          priceModifier: 0,
          attributes: { color: "Black" },
          isActive: true,
        },
      ],
    },
    {
      id: "6",
      name: "Smart Water Bottle",
      description: "Insulated water bottle that tracks hydration",
      sku: "BTTLE-001",
      categoryId: "cat-6",
      basePrice: 49.99,
      reorderPoint: 10,
      isActive: true,
      imageUrls: ["/api/placeholder/400/400"],
      variants: [
        {
          id: "v15",
          productId: "6",
          name: "17oz, Teal",
          sku: "BTTLE-001-17-TEL",
          priceModifier: 0,
          attributes: { size: "17oz", color: "Teal" },
          isActive: true,
        },
        {
          id: "v16",
          productId: "6",
          name: "17oz, Black",
          sku: "BTTLE-001-17-BLK",
          priceModifier: 0,
          attributes: { size: "17oz", color: "Black" },
          isActive: true,
        },
        {
          id: "v17",
          productId: "6",
          name: "24oz, Teal",
          sku: "BTTLE-001-24-TEL",
          priceModifier: 10,
          attributes: { size: "24oz", color: "Teal" },
          isActive: true,
        },
        {
          id: "v18",
          productId: "6",
          name: "24oz, Black",
          sku: "BTTLE-001-24-BLK",
          priceModifier: 10,
          attributes: { size: "24oz", color: "Black" },
          isActive: true,
        },
      ],
    },
  ];
};

// Function to fetch products - in a real application, this would call an API
export const getProducts = async (): Promise<Product[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getMockProducts();
};

// Function to get a single product by ID
export const getProductById = async (
  id: string
): Promise<Product | undefined> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getMockProducts().find((product) => product.id === id);
};
