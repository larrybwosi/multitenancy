// actions/reporting.actions.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  Report,
  ReportType,
  ReportStatus,
  MemberRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getBusinessAuthContext } from "./business";
import { GoogleGenerativeAI } from "@google/generative-ai";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Example S3
// import { Storage } from '@google-cloud/storage'; // Example GCS
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // Example PDF lib

// --- Zod Schemas ---
const OrganisationIdSchema = z
  .string()
  .cuid({ message: "Invalid Organisation ID" });
const RequiredCuidSchema = z
  .string()
  .cuid({ message: "Required ID is missing or invalid" });

const RequestReportSchema = z
  .object({
    organisationId: OrganisationIdSchema,
    type: z.nativeEnum(ReportType),
    // For non-predefined types, allow date range
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // Require dates only for CUSTOM type, maybe? Or allow overriding defaults?
      // For simplicity, let server calculate dates for predefined types
      if (data.type !== ReportType.CUSTOM && (data.startDate || data.endDate)) {
        // Maybe ignore provided dates for predefined types or return error?
      }
      if (
        data.type === ReportType.CUSTOM &&
        (!data.startDate || !data.endDate)
      ) {
        return false; // Dates required for custom type
      }
      if (data.startDate && data.endDate && data.startDate > data.endDate) {
        return false; // Start date must be before end date
      }
      return true;
    },
    {
      message:
        "Start and End dates are required for Custom reports, and Start must be before End.",
      path: ["startDate", "endDate"],
    }
  );

// --- Types ---
type ActionResponse<T = null> = Promise<
  { success: true; data: T } | { success: false; error: string; details?: any }
>;

// --- Environment Variables (IMPORTANT!) ---
// You MUST set these in your .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Example S3 config:
// const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
// const S3_REGION = process.env.S3_REGION;
// const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
// const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

// --- Actions ---

/**
 * Calculates the start and end dates for predefined report types.
 */
function calculateDateRange(type: ReportType): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date(); // Use current server time
  // Set time to start/end of day for consistency
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  switch (type) {
    case ReportType.DAILY:
      return { startDate: todayStart, endDate: todayEnd };
    case ReportType.WEEKLY:
      const dayOfWeek = todayStart.getDay(); // 0 (Sun) - 6 (Sat)
      const diffStart =
        todayStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
      const weekStart = new Date(todayStart.setDate(diffStart));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { startDate: weekStart, endDate: weekEnd };
    case ReportType.MONTHLY:
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      ); // Last day of current month
      return { startDate: monthStart, endDate: monthEnd };
    case ReportType.ANNUAL:
      const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0); // Jan 1st
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31st
      return { startDate: yearStart, endDate: yearEnd };
    default: // Should not happen if type is validated, but return daily as fallback
      console.warn(`Unsupported report type for date calculation: ${type}`);
      return { startDate: todayStart, endDate: todayEnd };
  }
}

/**
 * Creates a request to generate a report.
 * This action only creates the DB record; actual generation is asynchronous.
 */
export async function requestReportGeneration(
  input: z.infer<typeof RequestReportSchema>
): ActionResponse<Report> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return { success: false, error: "Reporting service is not configured." };
  }

  try {
    const { organisationId, type } = input;
    // !! IMPORTANT: Auth Check !!
    const auth = await getBusinessAuthContext(organisationId, [
      MemberRole.ADMIN,
      MemberRole.OWNER,
    ]); // Only admins/owners?

    const validation = RequestReportSchema.safeParse(input);
    if (!validation.success)
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };

    let { startDate, endDate } = validation.data;

    // Calculate dates for predefined types, ignore provided dates
    if (type !== ReportType.CUSTOM) {
      const calculatedDates = calculateDateRange(type);
      startDate = calculatedDates.startDate;
      endDate = calculatedDates.endDate;
    } else if (!startDate || !endDate) {
      // This case should be caught by Zod refine, but double-check
      return {
        success: false,
        error: "Start and End dates are required for Custom reports.",
      };
    }

    // Create the report record in PENDING status
    const reportRecord = await db.report.create({
      data: {
        organisationId: organisationId,
        type: type,
        status: ReportStatus.PENDING,
        startDate: startDate!,
        endDate: endDate!,
        requestedById: auth.memberId, // Link to the Member requesting
      },
    });

    // --- Trigger Asynchronous Generation ---
    // !! IMPORTANT !!
    // This is where you trigger your background job/worker.
    // Options:
    // 1. Queue System (BullMQ, RabbitMQ, SQS): Send a message with reportRecord.id.
    // 2. Serverless Function (AWS Lambda, Google Cloud Functions): Invoke function with reportRecord.id.
    // 3. Simple (Not recommended for production): `setTimeout(() => generateReportInBackground(reportRecord.id), 0);`
    console.log(
      `Report requested (ID: ${reportRecord.id}). Triggering background generation...`
    );
    // Example placeholder: triggerBackgroundReportJob(reportRecord.id);

    revalidatePath(`/dashboard/${organisationId}/reports`);
    return { success: true, data: reportRecord };
  } catch (error: any) {
    console.error("Request Report Generation Error:", error);
    return {
      success: false,
      error: error.message || "Failed to request report generation.",
    };
  }
}

// --- Background Generation Logic (Conceptual - NOT a Server Action) ---
// This function would run in your background worker/job processor.

/*
async function generateReportInBackground(reportId: string) {
    console.log(`Starting report generation for ID: ${reportId}`);
    let finalStatus: ReportStatus = ReportStatus.FAILED;
    let reportUrl: string | null = null;
    let errorMessage: string | null = null;

    try {
        // 1. Update Status to GENERATING
        await db.report.update({
            where: { id: reportId },
            data: { status: ReportStatus.GENERATING }
        });

        // 2. Fetch Report Metadata & Organisation Info
        const report = await db.report.findUnique({ where: { id: reportId }, include: { organisation: true }});
        if (!report || !report.organisation) throw new Error("Report or Organisation not found.");
        if (report.status !== ReportStatus.GENERATING) throw new Error("Report is not in GENERATING state.");

        const { startDate, endDate, organisationId, organisation } = report;

        // 3. Fetch Data for the Period
        const orders = await db.order.findMany({
            where: { organisationId, createdAt: { gte: startDate, lte: endDate }, status: { in: [OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }}, // Filter relevant orders
            include: { items: { include: { product: { select: { name: true }} } } }
        });
        const stockTransactions = await db.stockTransaction.findMany({
             where: { organisationId, transactionDate: { gte: startDate, lte: endDate } },
             include: { product: { select: { name: true } } }
        });
        // Fetch other relevant data (customers, etc.) if needed

        // 4. Prepare Data Summary for Gemini
        const salesTotal = orders.reduce((sum, order) => sum.add(order.finalAmount), new Decimal(0));
        const ordersCount = orders.length;
        const topSellingProducts = // Calculate based on order items
        const stockPurchases = stockTransactions.filter(t => t.type === StockTransactionType.PURCHASE);
        const stockSales = stockTransactions.filter(t => t.type === StockTransactionType.SALE);
        // Summarize more data...

        const promptData = `
            Generate a business report summary for ${organisation.name}.
            Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} (${report.type}).

            Key Metrics:
            - Total Sales Revenue: ${salesTotal.toFixed(2)}
            - Number of Orders Completed: ${ordersCount}
            // - Top Selling Products: [List top products and quantities/revenue]
            - Total Stock Purchased Value: // Calculate if needed
            - Total Stock Sold Quantity: // Sum quantities from SALE transactions
            - Stock Adjustments: // Count/summarize adjustments/spoilage

            Provide insights and analysis based on this data. Focus on sales trends, popular items, and stock movement highlights. Keep it concise and professional.
            --- Raw Data Snippets (Optional, might help context) ---
            Recent Orders: ${JSON.stringify(orders.slice(0, 5).map(o => ({ number: o.orderNumber, amount: o.finalAmount })))}
            Recent Stock Transactions: ${JSON.stringify(stockTransactions.slice(0, 5).map(t => ({ type: t.type, product: t.product.name, qty: t.quantityChange })))}
        `;

        // 5. Call Gemini API
        if (!GEMINI_API_KEY) throw new Error("Gemini API Key missing.");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or other suitable model
        const result = await model.generateContent(promptData);
        const response = result.response;
        const geminiText = response.text();

        // 6. Generate PDF
        // Example using pdf-lib (very basic)
        // const pdfDoc = await PDFDocument.create();
        // const page = pdfDoc.addPage();
        // const { width, height } = page.getSize();
        // const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        // page.drawText(`Report for ${organisation.name}`, { x: 50, y: height - 50, font, size: 18 });
        // page.drawText(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { x: 50, y: height - 75, font, size: 12 });
        // // Add Gemini text (handle wrapping)
        // page.drawText(geminiText, { x: 50, y: height - 120, font, size: 10, maxWidth: width - 100, lineHeight: 14 });
        // // Add data tables if needed
        // const pdfBytes = await pdfDoc.save();

        // TODO: Replace above with actual PDF generation logic

        const pdfBytes = Buffer.from("Dummy PDF content for testing"); // Placeholder PDF bytes

        // 7. Upload PDF to Bucket
        const reportFileName = `report-${organisation.slug}-${report.type.toLowerCase()}-${Date.now()}.pdf`;
        // Example using S3:
        // const s3Client = new S3Client({ region: S3_REGION, credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY } });
        // const putCommand = new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: reportFileName, Body: pdfBytes, ContentType: 'application/pdf' });
        // await s3Client.send(putCommand);
        // reportUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${reportFileName}`; // Construct URL

        // TODO: Replace above with actual upload logic and URL construction for your provider (S3/GCS etc.)
        reportUrl = `https://fake-bucket.example.com/${reportFileName}`; // Placeholder URL

        if (!reportUrl) throw new Error("Failed to upload report to storage.");

        // 8. Update Report Status to COMPLETED
        finalStatus = ReportStatus.COMPLETED;

    } catch (error: any) {
        console.error(`Report Generation Failed (ID: ${reportId}):`, error);
        finalStatus = ReportStatus.FAILED;
        errorMessage = error.message || "An unknown error occurred during report generation.";
    } finally {
        // 9. Final DB Update (Status, URL/Error Message)
        await db.report.update({
            where: { id: reportId },
            data: {
                status: finalStatus,
                reportUrl: reportUrl,
                errorMessage: errorMessage,
                generatedAt: (finalStatus === ReportStatus.COMPLETED) ? new Date() : null,
            }
        });
         // Notify user? (e.g., via websockets, email)
        console.log(`Report generation finished for ID: ${reportId} with status: ${finalStatus}`);
    }
}
*/

// --- Read Actions for Reports ---

export async function getReports(
  organisationId: string
): ActionResponse<Report[]> {
  try {
    await getBusinessAuthContext(organisationId);
    const reports = await db.report.findMany({
      where: { organisationId },
      include: {
        requestedBy: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reports };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch reports.",
    };
  }
}

export async function getReportDetails(
  organisationId: string,
  reportId: string
): ActionResponse<Report | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const report = await db.report.findUnique({
      where: { id: reportId, organisationId },
      include: {
        requestedBy: { include: { user: { select: { name: true } } } },
      },
    });
    if (!report) {
      return { success: false, error: "Report not found." };
    }
    return { success: true, data: report };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch report details.",
    };
  }
}
