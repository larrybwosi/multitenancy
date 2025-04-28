"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, FileDown, FileUp, PackageOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function InventoryActions() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Export logic would go here
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href="/inventory/restock">
          <PackageOpen className="mr-2 h-4 w-4" />
          Bulk Restock
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/inventory/adjust">
              <Plus className="mr-2 h-4 w-4" />
              Adjust Stock
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
            <FileDown className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/transfers/new">
              <FileUp className="mr-2 h-4 w-4" />
              Transfer Stock
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
