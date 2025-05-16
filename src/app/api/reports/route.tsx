// import { getServerAuthContext } from "@/actions/auth";
// import { generateSalesReportAction } from "@/actions/reports/sales";
import MarkdownToPdfDocument from "@/utils/prompts/pdf";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function GET() {
  // const { organizationId} = await getServerAuthContext()
  // const response = await generateSalesReportAction({
  //   dateFrom: new Date('2025-01-15T12:26:08.433Z'),
  //   dateTo: new Date('2025-05-15T12:26:08.433Z'),
  //   organizationId,
  // });
  const markdownReport = `
  # Sales Performance Report - Dealio Inc (org-dealio-inc)
  **Reporting Period:** 2025-01-15 to 2025-05-15
  
  **I. Executive Summary:**
  
  This report analyzes the sales performance of Dealio Inc. for the period between January 15th, 2025, and May 15th, 2025. During this period, the company generated a total gross revenue of $13,022.00 and a total net revenue of $15,939.36. After accounting for the cost of goods sold, the total profit was $1,926.00. A total of 40 items were sold across 32 transactions. The "Oraimo Cable" and "Huawei" are the key product contributors. Sales were conducted exclusively at the Main Store location, managed by Larry Dean.
  
  **II. Overall Sales Performance:**
  
  * **Total Gross Revenue:** $13,022.00
  * **Total Discounts Given:** $0.00
  * **Total Taxes Collected:** $2,917.36
  * **Total Net Revenue:** $15,939.36
  * **Total Items Sold:** 40
  * **Total Number of Sales Transactions:** 32
  * **Average Transaction Value (ATV):** $498.11
  
  **Profit Analysis:**
  
  * **Total Cost of Goods Sold (COGS):** $0.00 (Unit Cost data unavailable. Assumed to be 0 for COGS calculation for this report)
  * **Total Profit:** $1,926.00 (Calculated as sum of ((SaleItem.unitPrice - SaleItem.unitCost) * SaleItem.quantity - SaleItem.discountAmount) for all items )
  * **Overall Profit Margin:** 12.08%
  
  **III. Product Performance Analysis:**
  
  **Best-Selling Products/Variants:**
  
  * **By Quantity Sold:**
  
  | Product Name        | Variant Name              | SKU                      | Quantity Sold |
  | ------------------- | ------------------------- | ------------------------ | ------------- |
  | Oraimo Cable        | Default - Oraimo Cable    | VAR-PROD-8F46E--DEFAULT  | 20            |
  | Huawei              | Default - Some New Product| VAR-PROD-98429--DEFAULT  | 11            |
  | Calipigian          | Default - Calipigian      | VAR-PROD-4BB67--DEFAULT  | 6             |
  
  * **By Revenue Generated (Before Tax):**
  
  | Product Name        | Variant Name              | SKU                      | Total Revenue (UnitPrice * Quantity) |
  | ------------------- | ------------------------- | ------------------------ | ------------------------------------- |
  | Calipigian          | Default - Calipigian      | VAR-PROD-4BB67--DEFAULT  | $2,700.00                             |
  | Huawei              | Default - Some New Product| VAR-PROD-98429--DEFAULT  | $2,970.00                             |
  | Oraimo Cable        | Default - Oraimo Cable    | VAR-PROD-8F46E--DEFAULT  | $2,760.00                             |
  
  * **By Profit Generated:**
  
  | Product Name        | Variant Name              | SKU                      | Total Profit |
  | ------------------- | ------------------------- | ------------------------ | ------------ |
  | Calipigian          | Default - Calipigian      | VAR-PROD-4BB67--DEFAULT  | $2,700.00    |
  | Huawei              | Default - Some New Product| VAR-PROD-98429--DEFAULT  | $2,970.00    |
  | Oraimo Cable        | Default - Oraimo Cable    | VAR-PROD-8F46E--DEFAULT  | $2,760.00    |
  
  **Worst-Performing Products/Variants:** (Not applicable, only 3 unique products sold)
  
  **Product Contribution to Profit:**
  
  The Oraimo Cable, Huawei and Calipigian products are the sole contributors to the overall profit due to the limited product variety in the dataset.
  
  **IV. Category Performance Analysis:**
  
  * **Best-Selling Categories:**
  
  | Category    | Quantity Sold | Revenue Generated (Before Tax) | Profit Generated |
  | ----------- | ------------- | -------------------------------- | ---------------- |
  | Electronics | 27            | $5,460.00                        | $5,460.00        |
  | Foods       | 11            | $2,970.00                        | $2,970.00        |
  
  **Category Contribution to Overall Sales and Profit:**
  Electronics category contributed significantly to overall quantity sold, revenue, and profit during this period. Foods contributed a significant share in revenue and profit as well.
  
  **V. Location (Branch) Performance Analysis:**
  
  * **Sales by Location:**
  
  | Location Name | Total Net Revenue | Total Items Sold | Total Profit | Average Transaction Value |
  | ------------- | ----------------- | ---------------- | ------------ | ------------------------- |
  | Main Store    | $15,939.36        | 40               | $1,926.00    | $498.11                   |
  
  The only location, "Main Store," accounts for all sales during this period.
  
  **VI. Sales Team/Member Performance Analysis:**
  
  * **Sales by Member:**
  
  | Member Name | Total Net Revenue | Total Number of Sales Transactions | Total Items Sold | Average Transaction Value |
  | ----------- | ----------------- | ---------------------------------- | ---------------- | ------------------------- |
  | Larry Dean  | $15,939.36        | 32                                 | 40               | $498.11                   |
  
  All sales were processed by Larry Dean, the sole sales member identified in the data.
  
  **VII. Customer Insights:**
  
  * Out of 32 transactions, 2 involved the customer "Mary Jane" (CUST\_5a2a61), accounting for about 6.25% of the total transactions. Her total spending for the period = 138 + 138 = $276.00.
  
  **VIII. Payment Method Analysis:**
  
  * All sales were conducted using **CASH**.
  
  **IX. Key Insights and Recommendations:**
  
  * **Dominance of Cash Payments:** The exclusive use of cash payments may present security risks and limit customer convenience. Consider introducing alternative payment methods such as card payments or mobile wallets.
  * **Limited Product Variety:** The majority of sales are concentrated on a few products (Oraimo Cable, Huawei, and Calipigian). Expand product offerings to cater to a wider range of customer needs and preferences.
  * **Category Concentration:** Sales are heavily skewed towards the "Electronics" category. Explore opportunities to diversify into other categories to reduce dependence on a single product line.
  * **Customer Acquisition:** The provided data lacks sufficient customer segmentation. Implement strategies to gather more customer data to enable targeted marketing efforts and personalized offers. Consider offering a loyalty program to encourage repeat purchases and build customer relationships.
  * **Single Location Performance**: All sales occurred at "Main Store". There are no comparatives to other locations or branch performance.
  * **No Discounts.** Recommend the use of discounts or promotions to increase sales.
  `; 
  const stream = await renderToBuffer(<MarkdownToPdfDocument markdownString={markdownReport} documentTitle="Sales Performance Report" />)
  return new NextResponse(stream as unknown as ReadableStream)
}