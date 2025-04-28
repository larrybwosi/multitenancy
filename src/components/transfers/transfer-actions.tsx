"use client"

import Link from "next/link"
import { Plus, FileDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function TransferActions() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
        <Link href="/transfers/new">
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Export All</DropdownMenuItem>
          <DropdownMenuItem>Export Pending</DropdownMenuItem>
          <DropdownMenuItem>Export Completed</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
