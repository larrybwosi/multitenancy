
// --- Interfaces for Report Generation ---
import { Prisma } from '@/prisma/client';
import {
  DETAILED_SALES_REPORT_PROMPT_TEMPLATE,
  DETAILED_EXPENSES_REPORT_PROMPT_TEMPLATE,
} from './prompts/reports';
import { getGeminiClient } from '@/lib/gemini';

// ReportFilters now includes organizationId, dateFrom, dateTo, and other optional filters
export interface ReportFilters {
  organizationId: string;
  dateFrom: Date;
  dateTo: Date;
  customerId?: string;
  memberId?: string; // For sales by member filter, or expenses by member
  locationId?: string; // For sales by location filter, or expenses by location
  categoryId?: string; // For expenses by category filter
  supplierId?: string; // For expenses by supplier filter
  // Add other specific filters as needed
}

// Define more specific types for the data being passed based on Prisma queries
// These are illustrative; you'd ideally generate these from your Prisma schema or use Prisma's generated types.
export type PrismaSalesData = Prisma.SaleGetPayload<{}>;
export type PrismaExpensesData = Prisma.ExpenseGetPayload<{}>; 

export interface ReportDataInput {
  organizationId: string;
  startDate: string;
  endDate: string;
  data: PrismaSalesData[] | PrismaExpensesData[];
}

// This would be the expected structured output from the Gemini API
// For simplicity, we'll assume Gemini returns a string (e.g., Markdown) which can be rendered.
// Or it could be a more structured JSON object.
export interface GeneratedReport {
  title: string;
  period: {
    from: string;
    to: string;
  };
  content: string; // This will hold the detailed report content from Gemini (e.g., Markdown)
  generatedAt: Date;
  // You might add more structured fields if Gemini can provide them, e.g., keyMetrics: {}
}

// --- Gemini API Service ---
export async function generateReportWithGeminiAPI(
  reportType: 'sales' | 'expenses',
  input: ReportDataInput
): Promise<GeneratedReport> {
  // Changed to return string content for simplicity
  let promptTemplate = '';
  if (reportType === 'sales') {
    promptTemplate = DETAILED_SALES_REPORT_PROMPT_TEMPLATE;
  } else {
    promptTemplate = DETAILED_EXPENSES_REPORT_PROMPT_TEMPLATE;
  }

  // Populate the template
  const populatedPrompt = promptTemplate
    .replace('{{organizationId}}', input.organizationId)
    .replace('{{startDate}}', input.startDate)
    .replace('{{endDate}}', input.endDate);

  // Construct the full prompt including the data
  const fullPrompt = `${populatedPrompt}\n\n**Actual Data (JSON):**\n\`\`\`json\n${JSON.stringify(input.data, null, 2)}\n\`\`\``;

  // Simulate API call latency & conceptual call
  console.log(`--- Sending to Conceptual Gemini API for ${reportType} report ---`);
  console.log('Data snippet:', JSON.stringify(input.data[0], null, 2)); // Log a sample
  await new Promise(resolve => setTimeout(resolve, 1500));

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
  
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
console.log('Response:', response);
  // For this example, we'll return a mock response.
//   const mockReportContent = `
// # ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report for ${input.organizationId}
// ## Period: ${input.startDate} to ${input.endDate}

// This is a **mock-generated ${reportType} report**.
// The AI would analyze the provided data based on the detailed prompt and generate content here.
// It would include sections like:
// - Executive Summary
// - Detailed Breakdowns (as per the prompt)
// - Key Insights
// - Recommendations

// *The actual content would be many pages long and very detailed based on the prompt and data.*
// `;

  return {
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (Gemini Generated)`,
    period: {
      from: input.startDate,
      to: input.endDate,
    },
    content: response, // In reality, this comes from Gemini
    generatedAt: new Date(),
  };
}
