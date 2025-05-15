// prompts/reportPrompts.ts

export const DETAILED_SALES_REPORT_PROMPT_TEMPLATE = `
**Role:** You are an expert financial analyst and data interpretation AI. Your task is to generate a comprehensive and insightful sales report.

**Objective:** Analyze the provided sales data for organization ID "{{organizationId}}" covering the period from "{{startDate}}" to "{{endDate}}". Produce a detailed, well-structured report suitable for management review.

**Input Data:**
(The sales data is provided below in JSON format)

**Report Structure and Content Requirements:**

**I. Executive Summary:**
   - Brief overview of the sales performance for the period.
   - Highlight total gross revenue, total net revenue (after discounts and taxes), total profit, and total items sold.
   - Mention any significant trends or standout findings.

**II. Overall Sales Performance:**
   - **Total Gross Revenue:** Sum of \`Sale.totalAmount\`.
   - **Total Discounts Given:** Sum of \`Sale.discountAmount\`.
   - **Total Taxes Collected:** Sum of \`Sale.taxAmount\`.
   - **Total Net Revenue:** Sum of \`Sale.finalAmount\`.
   - **Total Items Sold:** Sum of \`SaleItem.quantity\` across all sales.
   - **Total Number of Sales Transactions.**
   - **Average Transaction Value (ATV):** Total Net Revenue / Total Number of Sales Transactions.
   - **Profit Analysis:**
      - **Total Cost of Goods Sold (COGS):** Sum of (\`SaleItem.unitCost\` * \`SaleItem.quantity\`) for all items sold.
      - **Total Profit:** Total Net Revenue - Total COGS. (Note: Ensure Net Revenue is used consistently, or clarify if Gross Revenue before tax should be used for profit calculation against COGS. For this report, assume profit = Sum of ((SaleItem.unitPrice * SaleItem.quantity) - (SaleItem.unitCost * SaleItem.quantity) - SaleItem specific discounts) for all items, then sum these profits. Or, Total Net Revenue - COGS). For clarity, let's define item profit as (SaleItem.unitPrice * SaleItem.quantity - SaleItem related discounts) - (SaleItem.unitCost * SaleItem.quantity). Sum these item profits to get Total Profit.
      - **Overall Profit Margin:** (Total Profit / Total Net Revenue) * 100%.

**III. Product Performance Analysis:**
   - **Best-Selling Products/Variants (Top 5-10):**
      - By **Quantity Sold:** List product/variant name, SKU, quantity sold.
      - By **Revenue Generated:** List product/variant name, SKU, total net revenue generated (sum of \`SaleItem.totalAmount\` which is (unitPrice * quantity) - discountAmount + taxAmount for the item line. Or use item's (unitPrice * quantity - itemDiscount) if available before tax). Prefer using (SaleItem.unitPrice * quantity) - SaleItem.discountAmount for revenue contribution before sale-level adjustments or tax.
      - By **Profit Generated:** List product/variant name, SKU, total profit generated ( (SaleItem.unitPrice - SaleItem.unitCost) * SaleItem.quantity - SaleItem.discountAmount ).
   - **Worst-Performing Products/Variants (Bottom 5-10 by quantity sold, if significant).**
   - **Product Contribution to Profit:** Identify products contributing most significantly to overall profit.

**IV. Category Performance Analysis:**
   - **Best-Selling Categories (Top 3-5):**
      - By **Quantity Sold:** List category name, total quantity sold.
      - By **Revenue Generated:** List category name, total net revenue generated.
      - By **Profit Generated:** List category name, total profit generated.
   - **Category Contribution to Overall Sales and Profit.**

**V. Location (Branch) Performance Analysis:**
   - **Sales by Location:**
      - For each \`InventoryLocation\` (\`location.name\`):
         - Total Net Revenue.
         - Total Items Sold.
         - Total Profit Generated.
         - Average Transaction Value.
   - **Identify the Best Performing Branch(es)** based on revenue and profit.
   - **Identify Underperforming Branch(es)** if applicable.

**VI. Sales Team/Member Performance Analysis:**
   - **Sales by Member:**
      - For each \`Member\` (\`member.user.name\`):
         - Total Net Revenue Generated.
         - Total Number of Sales Transactions.
         - Total Items Sold.
         - Average Transaction Value.
   - **Identify Top Performing Sales Members.**

**VII. Customer Insights (Optional, if customer data is rich):**
   - **Sales by Customer Type/Segment (if available).**
   - **New vs. Returning Customer Sales (if identifiable).**
   - **Top Customers by Purchase Value (if applicable and data is sufficient).**

**VIII. Payment Method Analysis:**
   - Breakdown of sales revenue by \`paymentMethod\`.
   - Identify the most frequently used payment methods.

**IX. Key Insights and Recommendations:**
   - Summarize the most critical findings from the analysis.
   - Identify any emerging trends, opportunities, or areas of concern.
   - Provide actionable recommendations based on the data (e.g., inventory adjustments for best-sellers, marketing focus for certain categories, training for sales members, strategies for underperforming branches).

**Formatting Guidelines:**
   - Use clear headings and subheadings.
   - Present quantitative data in tables where appropriate for easy comparison.
   - Use bullet points for lists.
   - Write in a professional and analytical tone.
   - Ensure calculations are accurate based on the provided data definitions.
   - If data for a specific metric is insufficient or not available, clearly state that.

Please proceed with generating the report based on the data that will be provided. Structure your response in Markdown format
`;

export const DETAILED_EXPENSES_REPORT_PROMPT_TEMPLATE = `
**Role:** You are an expert financial analyst and data interpretation AI. Your task is to generate a comprehensive and insightful expenses report.

**Objective:** Analyze the provided expenses data for organization ID "{{organizationId}}" covering the period from "{{startDate}}" to "{{endDate}}". Produce a detailed, well-structured report suitable for management and financial control.

**Input Data:**
(The expenses data is provided below in JSON format)

**Report Structure and Content Requirements:**

**I. Executive Summary:**
   - Brief overview of total expenses for the period.
   - Highlight key expense categories and any significant deviations or trends.
   - Mention overall financial health concerning expenditure.

**II. Overall Expense Analysis:**
   - **Total Expenses:** Sum of \`Expense.amount\`.
   - **Total Number of Expense Transactions.**
   - **Average Expense Value:** Total Expenses / Total Number of Expense Transactions.
   - **Breakdown by Expense Status (e.g., PENDING, APPROVED, PAID, REJECTED):** Show total amount and count for each status.

**III. Expense Breakdown by Category:**
   - For each \`ExpenseCategory\` (\`category.name\`):
      - Total amount spent.
      - Percentage of total expenses.
      - Number of transactions.
   - **Identify Top 5-10 Expense Categories by amount.**
   - Visualize this breakdown (e.g., suggest a pie chart or bar chart in description).

**IV. Expense Breakdown by Location/Department (if applicable):**
   - If \`locationId\` is consistently used and represents different cost centers/departments:
      - For each \`InventoryLocation\` (\`location.name\`):
         - Total amount spent.
         - Percentage of total expenses.
   - **Identify Locations/Departments with the Highest Expenditures.**

**V. Expense Breakdown by Supplier (if applicable):**
   - If \`supplierId\` is consistently used:
      - For each \`Supplier\` (\`supplier.name\`):
         - Total amount spent.
         - Number of transactions.
   - **Identify Top Suppliers by expenditure.**

**VI. Expense Breakdown by Payment Method:**
   - Total expenses for each \`paymentMethod\`.
   - Percentage of total expenses.

**VII. Analysis of Major Expenses:**
   - List the **Top 10-20 individual expense transactions** by \`amount\`, including description, category, and date.
   - Discuss any unusually large or recurring significant expenses.

**VIII. Budget vs. Actual Analysis (if budget data is provided and linked):**
   - If expenses are linked to \`Budget\` entries (\`budgetId\`) and budget details (e.g., budget name, \`budget.amount\` as allocated amount, \`budget.periodStart\`, \`budget.periodEnd\`) are available in the provided data:
      - For each relevant Budget:
         - Budget Name.
         - Budgeted Amount for the period.
         - Actual Amount Spent (sum of linked \`Expense.amount\` falling within the budget period and report period).
         - Variance (Budgeted - Actual).
         - Percentage of Budget Utilized.
      - Highlight budgets that are over or under utilized significantly.

**IX. Reimbursable Expenses Analysis (if applicable):**
   - Total amount of expenses marked as \`isReimbursable\`.
   - Breakdown by submitter (\`member.user.name\`) or category if significant.

**X. Compliance Check (Optional):**
    - If policies like \`expenseReceiptRequired\` exist for the organization and relevant expense data (\`Expense.receiptUrl\`) is available:
        - Report on the percentage of expenses compliant with receipt policy.
        - List significant expenses missing receipts if applicable.

**XI. Key Insights and Recommendations:**
   - Summarize the most critical findings from the expense analysis.
   - Identify areas of high spending or potential cost-saving opportunities.
   - Point out any anomalies, unexpected expenditures, or compliance issues.
   - Provide actionable recommendations (e.g., budget adjustments, supplier negotiations, policy reviews, areas for deeper investigation).

**Formatting Guidelines:**
   - Use clear headings and subheadings.
   - Present quantitative data in tables where appropriate for easy comparison.
   - Use bullet points for lists.
   - Write in a professional and analytical tone.
   - Ensure calculations are accurate based on the provided data definitions.
   - If data for a specific metric is insufficient or not available, clearly state that.

Please proceed with generating the report based on the data that will be provided. Structure your response in Markdown format
`;
