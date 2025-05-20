// Mock API functions

// Fetch order queues
export async function fetchOrderQueues() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: 1,
      orderNumber: "2008-3A",
      status: "Ready to serve",
      customerName: "Anggita Dwi Pratama",
      timestamp: "12:00, 2023, 11:30 pm",
      itemCount: 5,
      tableNumber: "3B",
    },
    {
      id: 2,
      orderNumber: "2008-5A",
      status: "On cooking",
      customerName: "Dwi Lestari Gabriela",
      timestamp: "12:00, 2023, 11:00 pm",
      itemCount: 8,
      tableNumber: "2C",
    },
    {
      id: 3,
      orderNumber: "2008-9A",
      status: "Canceled",
      customerName: "Devano Cahyo Anggara",
      timestamp: "12:00, 2023, 10:45 pm",
      itemCount: 4,
      tableNumber: "1D",
    },
    {
      id: 4,
      orderNumber: "2008-11A",
      status: "Ready to serve",
      customerName: "Siti Nurhaliza",
      timestamp: "12:00, 2023, 10:30 pm",
      itemCount: 6,
      tableNumber: "5A",
    },
  ]
}

// Fetch products by category
export async function fetchProducts(category) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const products = {
    Appetizers: [
      {
        id: 1,
        name: 'Spring Rolls',
        price: 45000,
        image:
          'https://media.istockphoto.com/id/1309352410/photo/cheeseburger-with-tomato-and-lettuce-on-wooden-board.jpg?b=1&s=612x612&w=0&k=20&c=qD01FkeyMFSpGVvle2OXoQNYJlbgsDPk2L5_GeHe8RU=',
        variants: ['Original', 'Spicy'],
      },
      {
        id: 2,
        name: 'Calamari Rings',
        price: 65000,
        image: 'https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Garlic'],
      },
      {
        id: 3,
        name: 'Prawn Crackers',
        price: 35000,
        image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Spicy'],
      },
    ],
    'Seafood platters': [
      {
        id: 4,
        name: 'Mixed Seafood Platter',
        price: 250000,
        image:
          'https://media.istockphoto.com/id/1469228227/photo/fresh-salad-of-lentils-spinach-and-almonds.jpg?b=1&s=612x612&w=0&k=20&c=eUrllzA_Z_jvak5kIjf8SDRjcm_qfDJ8v-8KeDZ7CsU=',
        variants: ['Small', 'Medium', 'Large'],
      },
      {
        id: 5,
        name: 'Grilled Seafood Combo',
        price: 280000,
        image:
          'https://media.istockphoto.com/id/1214416414/photo/barbecued-salmon-fried-potatoes-and-vegetables-on-wooden-background.jpg?b=1&s=612x612&w=0&k=20&c=C6LrStXcfzq2iKmCeCFsYXeKa-JBGEz0s8ZcpD1XKkk=',
        variants: ['Original', 'Spicy'],
      },
    ],
    Shrimp: [
      {
        id: 6,
        name: 'Spicy shrimp with rice',
        price: 70000,
        image: 'https://images.pexels.com/photos/103124/pexels-photo-103124.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Extra spicy'],
      },
      {
        id: 7,
        name: 'Garlic fried butter mussels',
        price: 75000,
        image: 'https://images.pexels.com/photos/414555/pexels-photo-414555.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Sweet chili'],
      },
      {
        id: 8,
        name: 'Thai hot seafood soup',
        price: 80000,
        image: 'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Tom yum'],
      },
    ],
    Fish: [
      {
        id: 9,
        name: 'Grilled Salmon',
        price: 120000,
        image: 'https://images.pexels.com/photos/793785/pexels-photo-793785.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Lemon butter', 'Teriyaki'],
      },
      {
        id: 10,
        name: 'Fish and Chips',
        price: 85000,
        image: 'https://images.pexels.com/photos/2297961/pexels-photo-2297961.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Spicy'],
      },
    ],
    Crab: [
      {
        id: 11,
        name: 'Chili Crab',
        price: 180000,
        image:
          'https://media.istockphoto.com/id/1408374876/photo/oatmeal-porridge-bowl-with-berry-fruits-in-female-hands.jpg?b=1&s=612x612&w=0&k=20&c=NMzSgZxmvwKg2228h-9RuKDUhQ0UYNI1wQS1XGDRQxA=',
        variants: ['Medium', 'Extra spicy'],
      },
      {
        id: 12,
        name: 'Butter Garlic Crab',
        price: 190000,
        image: 'https://www.pexels.com/photo/croissant-bread-on-a-wooden-tray-1510682/',
        variants: ['Original'],
      },
    ],
    Squid: [
      {
        id: 13,
        name: 'Salt and Pepper Squid',
        price: 75000,
        image: 'https://images.pexels.com/photos/936611/pexels-photo-936611.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Extra crispy'],
      },
      {
        id: 14,
        name: 'Grilled Squid',
        price: 85000,
        image: 'https://images.pexels.com/photos/1065030/pexels-photo-1065030.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Spicy'],
      },
    ],
    Rice: [
      //butter
      {
        id: 15,
        name: 'Seafood Fried Rice',
        price: 65000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Original', 'Spicy'],
      },
      {
        id: 16,
        name: 'Steamed Rice',
        price: 15000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['White', 'Brown'],
      },
    ],
    Drinks: [
      {
        id: 17,
        name: 'Fresh Lime Juice',
        price: 25000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Regular', 'Large'],
      },
      {
        id: 18,
        name: 'Iced Tea',
        price: 20000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Regular', 'Large'],
      },
    ],
    Dessert: [
      {
        id: 19,
        name: 'Mango Sticky Rice',
        price: 45000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Regular'],
      },
      {
        id: 20,
        name: 'Coconut Ice Cream',
        price: 35000,
        image: 'https://images.pexels.com/photos/1426715/pexels-photo-1426715.jpeg?auto=compress&cs=tinysrgb&w=600',
        variants: ['Single', 'Double'],
      },
    ],
  };

  return products[category] || []
}

// Create a new order
export async function createOrder(orderData) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Simulate success
  return {
    id: Math.floor(Math.random() * 1000),
    orderNumber: `${Math.floor(Math.random() * 10000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
    ...orderData,
    date: new Date().toISOString(),
    status: "Pending",
  }
}

// Fetch analytics data
export async function fetchAnalytics() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    revenue: {
      value: 2345678,
      change: 12.5,
      trend: "up",
    },
    customers: {
      value: 1234,
      change: -5.2,
      trend: "down",
    },
    transactions: {
      value: 567,
      change: 8.1,
      trend: "up",
    },
    products: {
      value: 89,
      change: 2.3,
      trend: "up",
    },
    recentOrders: [
      {
        id: 1,
        productName: "Spicy shrimp with rice",
        orderId: "2008-3A",
        date: "May 18, 2025",
        status: "Completed",
        icon: "🍚",
      },
      {
        id: 2,
        productName: "Mixed Seafood Platter",
        orderId: "2008-5A",
        date: "May 18, 2025",
        status: "Pending",
        icon: "🦞",
      },
      {
        id: 3,
        productName: "Fresh Lime Juice",
        orderId: "2008-7A",
        date: "May 17, 2025",
        status: "Canceled",
        icon: "🧃",
      },
      {
        id: 4,
        productName: "Grilled Salmon",
        orderId: "2008-9A",
        date: "May 17, 2025",
        status: "Completed",
        icon: "🐟",
      },
    ],
    topProducts: [
      {
        id: 1,
        name: "Spicy shrimp with rice",
        sales: 345,
        stock: 23,
        icon: "🍚",
      },
      {
        id: 2,
        name: "Mixed Seafood Platter",
        sales: 289,
        stock: 12,
        icon: "🦞",
      },
      {
        id: 3,
        name: "Fresh Lime Juice",
        sales: 234,
        stock: 56,
        icon: "🧃",
      },
      {
        id: 4,
        name: "Grilled Salmon",
        sales: 189,
        stock: 45,
        icon: "🐟",
      },
    ],
  }
}

// Fetch employee data
export async function fetchEmployeeData() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id: 1,
    name: "Antonio Fainaga",
    avatar: "/placeholder.svg?height=80&width=80",
    gender: "Male",
    age: 32,
    dateApplied: "Jan 1, 2023",
    position: "Project Manager",
    division: "Development",
    employeeId: "12345",
    email: "antonio@example.com",
    address: "123 Main St, Anytown",
    phone: "555-123-4567",
    kpiData: {
      percentage: 85,
      increase: 5,
    },
    activityData: {
      hours: 7,
      minutes: 45,
      pauseTime: 30,
      activeTime: 400,
      extraTime: 35,
    },
    projectData: {
      totalProjects: 12,
      projects: [
        { name: "FoodPoint App", percentage: 90 },
        { name: "New Website", percentage: 75 },
        { name: "Mobile App Redesign", percentage: 60 },
      ],
    },
    goals: [
      {
        title: "Increase Sales by 20%",
        description: "Achieve a 20% increase in sales revenue by the end of Q4.",
        dueDate: "Dec 31, 2023",
        priority: "High",
        status: "Completed",
      },
      {
        title: "Improve Customer Satisfaction",
        description: "Increase customer satisfaction score by 15% by the end of the year.",
        dueDate: "Dec 31, 2023",
        priority: "Medium",
        status: "In Progress",
      },
      {
        title: "Launch New Product",
        description: "Successfully launch the new product line by the end of Q3.",
        dueDate: "Sep 30, 2023",
        priority: "High",
        status: "In Progress",
      },
    ],
    attendanceData: {
      onTime: 20,
      late: 3,
      absent: 1,
      leave: 2,
    },
    projects: [
      {
        name: "FoodPoint App",
        description: "Develop a new mobile app for the FoodPoint restaurant.",
        startDate: "Jan 1, 2023",
        endDate: "Jun 30, 2023",
        status: "Completed",
        progress: 100,
      },
      {
        name: "New Website",
        description: "Design and develop a new website for the company.",
        startDate: "Mar 1, 2023",
        endDate: "Aug 31, 2023",
        status: "In Progress",
        progress: 75,
      },
      {
        name: "Mobile App Redesign",
        description: "Redesign the existing mobile app for better user experience.",
        startDate: "May 1, 2023",
        endDate: "Oct 31, 2023",
        status: "In Progress",
        progress: 60,
      },
    ],
    documents: {
      resumeDate: "Jan 15, 2023",
      contractDate: "Feb 1, 2023",
      idDate: "Jan 20, 2023",
    },
    notes: [
      {
        author: "John Smith",
        authorAvatar: "/placeholder.svg?height=32&width=32",
        date: "May 18, 2023",
        content: "Great work on the last project! Keep up the good work.",
      },
      {
        author: "Jane Doe",
        authorAvatar: "/placeholder.svg?height=32&width=32",
        date: "May 15, 2023",
        content: "Please remember to submit your timesheets by the end of the week.",
      },
    ],
  }
}

// Fetch orders data
export async function fetchOrders() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: "1",
      orderNumber: "2008-3A",
      date: "May 18, 2025",
      customerName: "Anggita Dwi Pratama",
      items: [
        { name: "Spicy shrimp with rice", price: 70000, quantity: 2 },
        { name: "Thai hot seafood soup", price: 80000, quantity: 1 },
      ],
      total: 220000,
      status: "Completed",
    },
    {
      id: "2",
      orderNumber: "2008-5A",
      date: "May 18, 2025",
      customerName: "Dwi Lestari Gabriela",
      items: [
        { name: "Mixed Seafood Platter", price: 250000, quantity: 1 },
        { name: "Fresh Lime Juice", price: 25000, quantity: 2 },
      ],
      total: 300000,
      status: "Pending",
    },
    {
      id: "3",
      orderNumber: "2008-9A",
      date: "May 17, 2025",
      customerName: "Devano Cahyo Anggara",
      items: [
        { name: "Spring Rolls", price: 45000, quantity: 1 },
        { name: "Calamari Rings", price: 65000, quantity: 1 },
      ],
      total: 110000,
      status: "Canceled",
    },
  ]
}
