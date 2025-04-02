// src/data/mockCustomers.ts
// src/types/customer.ts
// src/types/order.ts
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price per unit
  imageUrl?: string; // Optional image URL
}

export interface Order {
  id: string;
  name: string; // e.g., "Order #12345" or "Summer Sale Purchase"
  orderDate: Date;
  items: OrderItem[];
  totalAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  registeredDate: Date;
  status: "active" | "inactive" | "pending";
  loyaltyPoints: number; // Added loyalty points
  orders?: Order[]; // Added optional orders array
  avatarUrl?: string; // Optional avatar for more visual appeal
}

const generateOrders = (customerId: string): Order[] => {
  const orders: Order[] = [];
  const numOrders = Math.floor(Math.random() * 6); // 0 to 5 orders

  for (let i = 1; i <= numOrders; i++) {
    const items = [
      {
        productId: `prod_${i}a`,
        productName: `Awesome Gadget ${i}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: 29.99 + i * 5,
        imageUrl: `https://picsum.photos/seed/${customerId}_${i}a/50/50`,
      },
      {
        productId: `prod_${i}b`,
        productName: `Widget Pro ${i}`,
        quantity: 1,
        price: 99.5 + i * 10,
      }, // No image example
    ];
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    orders.push({
      id: `ord_${customerId}_${i}`,
      name: `Order #${1000 + i}`,
      orderDate: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
      items: items,
      totalAmount: totalAmount,
    });
  }
  // Sort by date descending to easily get the latest
  return orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
};

export const mockCustomers: Customer[] = [
  {
    id: "cus_1",
    name: "Alice Wonderland",
    email: "alice@example.com",
    company: "Wonderland Inc.",
    registeredDate: new Date(2024, 5, 15),
    status: "active",
    loyaltyPoints: 1250,
    avatarUrl: `https://i.pravatar.cc/150?u=alice@example.com`, // Using pravatar for unique avatars
    orders: generateOrders("cus_1"),
  },
  {
    id: "cus_2",
    name: "Bob The Builder",
    email: "bob@construction.co",
    company: "BuildIt Wright",
    registeredDate: new Date(2023, 11, 1),
    status: "active",
    loyaltyPoints: 850,
    avatarUrl: `https://i.pravatar.cc/150?u=bob@construction.co`,
    orders: generateOrders("cus_2"),
  },
  {
    id: "cus_3",
    name: "Charlie Chaplin",
    email: "charlie@silentfilms.org",
    company: "Keystone Studios",
    registeredDate: new Date(2024, 8, 20),
    status: "inactive",
    loyaltyPoints: 50,
    avatarUrl: `https://i.pravatar.cc/150?u=charlie@silentfilms.org`,
    orders: generateOrders("cus_3"),
  },
  {
    id: "cus_4",
    name: "Diana Prince",
    email: "diana@themyscira.gov",
    company: "Department of Antiquities",
    registeredDate: new Date(2025, 0, 10),
    status: "pending",
    loyaltyPoints: 300,
    avatarUrl: `https://i.pravatar.cc/150?u=diana@themyscira.gov`,
    orders: generateOrders("cus_4"),
  },
  // Add more customers as needed
];