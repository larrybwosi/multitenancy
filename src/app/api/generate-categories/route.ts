import { NextResponse } from "next/server";
// Define the expected structure for a category
type Category = {
  name: string;
  description: string;
};

const generateCategoriesWithGemini = async (
  description: string
): Promise<Category[]> => {
  console.log(
    `Simulating Gemini API call for description: "${description.substring(0, 100)}..."`
  );

  // --- !!! IMPORTANT !!! ---
  // This is where you would integrate the actual Google Gemini SDK or API client.
  // Example using a hypothetical SDK:
  // const geminiClient = new GeminiClient({ apiKey: process.env.GEMINI_API_KEY });
  // const prompt = `Based on the following business description, generate a list of 5-7 relevant business categories. For each category, provide a name and a brief, insightful description (1-2 sentences). Format the output as a JSON array of objects, where each object has a "name" and "description" key.\n\nDescription: "${description}"`;
  // const response = await geminiClient.generateContent(prompt);
  // const generatedJsonString = response.text(); // Assuming Gemini returns the JSON string
  // return JSON.parse(generatedJsonString);
  // --- End of hypothetical integration ---

  // --- Mocked Response ---
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Basic mock logic based on keywords (VERY simplified)
  let mockCategories: Category[] = [];
  if (
    description.toLowerCase().includes("retail") ||
    description.toLowerCase().includes("shop")
  ) {
    mockCategories = [
      {
        name: "Apparel & Fashion",
        description:
          "Clothing, footwear, and accessories for various demographics.",
      },
      {
        name: "Electronics",
        description:
          "Consumer electronics like phones, computers, and gadgets.",
      },
      {
        name: "Home Goods",
        description:
          "Items for household use, including decor, kitchenware, and furniture.",
      },
      {
        name: "Inventory Management",
        description:
          "Tracking stock levels, reordering, and managing product variations.",
      },
      {
        name: "Sales Reporting",
        description:
          "Analyzing sales trends, product performance, and revenue.",
      },
    ];
  } else if (
    description.toLowerCase().includes("consulting") ||
    description.toLowerCase().includes("service")
  ) {
    mockCategories = [
      {
        name: "Client Management",
        description:
          "Tracking client interactions, projects, and billing details.",
      },
      {
        name: "Project Delivery",
        description: "Managing project tasks, timelines, and deliverables.",
      },
      {
        name: "Billing & Invoicing",
        description: "Creating and sending invoices, tracking payments.",
      },
      {
        name: "Service Packages",
        description: "Defining and managing different service offerings.",
      },
      {
        name: "Business Development",
        description: "Tracking leads, proposals, and new client acquisition.",
      },
    ];
  } else {
    mockCategories = [
      {
        name: "General Operations",
        description: "Day-to-day business operational tasks and management.",
      },
      {
        name: "Financial Tracking",
        description:
          "Monitoring income, expenses, and overall financial health.",
      },
      {
        name: "Customer Relations",
        description: "Managing interactions and relationships with customers.",
      },
      {
        name: "Marketing & Sales",
        description:
          "Activities related to promoting and selling products/services.",
      },
    ];
  }
  // Simulate potential empty response sometimes
  // if (Math.random() > 0.8) return [];

  return mockCategories;
  // --- End of Mocked Response ---
};

// --- For App Router (`src/app/api/generate-categories/route.ts`) ---

// ... (keep the generateCategoriesWithGemini function) ...

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description } = body;

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "Business description is required." },
        { status: 400 }
      );
    }

    const categories = await generateCategoriesWithGemini(description);

    if (!categories) {
      console.warn(
        "Category generation returned no results for:",
        description.substring(0, 50)
      );
      return NextResponse.json({ categories: [] }, { status: 200 });
    }

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error("API Error generating categories:", error);
    if (error instanceof SyntaxError) {
      // Catch JSON parsing errors from request body
      return NextResponse.json(
        { message: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }
    // Consider specific error handling for Gemini call errors if possible
    return NextResponse.json(
      { message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
