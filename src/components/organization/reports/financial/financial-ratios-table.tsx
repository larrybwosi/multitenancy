"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FinancialRatiosTableProps {
  ratios: {
    profitability: Record<string, string>
    liquidity: Record<string, string>
    leverage: Record<string, string>
    efficiency: Record<string, string>
  }
}

export function FinancialRatiosTable({ ratios }: FinancialRatiosTableProps) {
  const [category, setCategory] = useState<"profitability" | "liquidity" | "leverage" | "efficiency">("profitability")

  return (
    <div className="space-y-4">
      <Tabs value={category} onValueChange={(value) => setCategory(value as any)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="leverage">Leverage</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ratio</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Benchmark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(ratios[category] || {}).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    {formatRatioName(key)}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{getRatioFormula(key)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>{value}</TableCell>
                <TableCell className="max-w-md">{getRatioDescription(key)}</TableCell>
                <TableCell>{getRatioBenchmark(key)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">
              About {category.charAt(0).toUpperCase() + category.slice(1)} Ratios
            </h3>
            <p className="text-sm text-muted-foreground">{getCategoryDescription(category)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatRatioName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/And/g, "&")
}

function getRatioDescription(key: string): string {
  const descriptions: Record<string, string> = {
    // Profitability
    grossMargin: "Shows the percentage of revenue that exceeds the cost of goods sold. Higher is better.",
    operatingMargin: "Measures operating profit as a percentage of revenue. Indicates operational efficiency.",
    netProfitMargin: "Shows how much of each dollar of revenue is converted into profit after all expenses.",
    returnOnAssets: "Measures how efficiently a company is using its assets to generate profit.",
    returnOnEquity: "Shows how much profit a company generates with the money shareholders have invested.",

    // Liquidity
    currentRatio: "Measures a company's ability to pay short-term obligations with current assets.",
    quickRatio: "A more stringent measure of liquidity that excludes inventory from current assets.",
    cashRatio: "Shows a company's ability to cover short-term liabilities with cash and cash equivalents.",

    // Leverage
    debtToEquity: "Compares a company's total debt to its shareholders' equity. Indicates financial leverage.",
    debtToAssets: "Shows the percentage of a company's assets that are financed by debt.",
    interestCoverage: "Measures a company's ability to pay interest on its outstanding debt.",

    // Efficiency
    assetTurnover: "Measures how efficiently a company is using its assets to generate revenue.",
    inventoryTurnover: "Shows how many times a company's inventory is sold and replaced over a period.",
    receivablesTurnover: "Measures how efficiently a company collects on its accounts receivable.",
  }

  return descriptions[key] || "Financial performance indicator"
}

function getRatioFormula(key: string): string {
  const formulas: Record<string, string> = {
    // Profitability
    grossMargin: "Gross Profit ÷ Revenue × 100%",
    operatingMargin: "Operating Profit ÷ Revenue × 100%",
    netProfitMargin: "Net Profit ÷ Revenue × 100%",
    returnOnAssets: "Net Income ÷ Average Total Assets × 100%",
    returnOnEquity: "Net Income ÷ Average Shareholders' Equity × 100%",

    // Liquidity
    currentRatio: "Current Assets ÷ Current Liabilities",
    quickRatio: "(Current Assets - Inventory) ÷ Current Liabilities",
    cashRatio: "Cash and Cash Equivalents ÷ Current Liabilities",

    // Leverage
    debtToEquity: "Total Debt ÷ Total Equity",
    debtToAssets: "Total Debt ÷ Total Assets",
    interestCoverage: "EBIT ÷ Interest Expense",

    // Efficiency
    assetTurnover: "Revenue ÷ Average Total Assets",
    inventoryTurnover: "Cost of Goods Sold ÷ Average Inventory",
    receivablesTurnover: "Net Credit Sales ÷ Average Accounts Receivable",
  }

  return formulas[key] || "Financial ratio formula"
}

function getRatioBenchmark(key: string): string {
  const benchmarks: Record<string, string> = {
    // Profitability
    grossMargin: "Industry dependent, typically 30-50%",
    operatingMargin: "Industry dependent, typically 10-20%",
    netProfitMargin: "Industry dependent, typically 5-20%",
    returnOnAssets: "5% or higher",
    returnOnEquity: "15-20% is considered good",

    // Liquidity
    currentRatio: "1.5-3.0 is healthy",
    quickRatio: "1.0 or higher",
    cashRatio: "0.5-1.0 is good",

    // Leverage
    debtToEquity: "1.5-2.0 or lower",
    debtToAssets: "0.3-0.6 is typical",
    interestCoverage: "2.0 or higher",

    // Efficiency
    assetTurnover: "Industry dependent, higher is better",
    inventoryTurnover: "Industry dependent, higher is better",
    receivablesTurnover: "Industry dependent, 4-6 times is common",
  }

  return benchmarks[key] || "Varies by industry"
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    profitability:
      "Profitability ratios measure a company's ability to generate earnings relative to its revenue, operating costs, assets, and equity. These ratios show how well a company utilizes its resources to generate profit and create shareholder value.",
    liquidity:
      "Liquidity ratios measure a company's ability to pay off its short-term debts as they come due, using the company's current or quick assets. Higher liquidity ratios indicate better financial health.",
    leverage:
      "Leverage ratios measure the amount of capital that comes from debt. These ratios indicate how much debt a company is using to finance its assets and operations, and its ability to meet its financial obligations.",
    efficiency:
      "Efficiency ratios measure how well a company utilizes its assets and resources. Higher efficiency ratios indicate better performance and management of assets and liabilities.",
  }

  return descriptions[category] || "Financial ratios help assess company performance and financial health."
}
