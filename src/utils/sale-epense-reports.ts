
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

  // Simulate API call latency & conceptual call
  console.log(`--- Sending to Conceptual Gemini API for ${reportType} report ---`);

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: populatedPrompt });
  // Stringify the data to include in the content generation
  const dataString = JSON.stringify(input.data, null, 2);
  // Call the Gemini API
  const result = await model.generateContent(dataString);

  // Safely access the response text
  let responseText: string;
  try {
    responseText = result.response.text();
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }
  } catch (error) {
    throw new Error(`Failed to parse Gemini API response: ${error.message}`);
  }

  // Optionally, validate or parse the response if structured data is expected
  // Example: If Gemini returns JSON, parse it and map to GeneratedReport
    let structuredContent: any;
    try {
      structuredContent = JSON.parse(responseText);
      console.log(structuredContent)
      // Map structuredContent to GeneratedReport fields if needed
    } catch {
      console.log('Failed to parse')
      // Fallback to treating response as plain text
    }
  return {
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (Gemini Generated)`,
    period: {
      from: input.startDate,
      to: input.endDate,
    },
    content: responseText,
    generatedAt: new Date(),
  };
}
