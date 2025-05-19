"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function TableSettings() {
  const [tables, setTables] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    capacity: "4",
    status: "available",
    area: "main",
  })

  useEffect(() => {
    // Simulate API call to fetch tables
    setTimeout(() => {
      setTables([
        { id: 1, name: "Table 1", capacity: 4, status: "available", area: "main" },
        { id: 2, name: "Table 2", capacity: 2, status: "occupied", area: "main" },
        { id: 3, name: "Table 3", capacity: 6, status: "available", area: "outdoor" },
        { id: 4, name: "Table 4", capacity: 4, status: "reserved", area: "main" },
        { id: 5, name: "Table 5", capacity: 8, status: "available", area: "private" },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleAddTable = () => {
    setEditingTable(null)
    setFormData({
      name: "",
      capacity: "4",
      status: "available",
      area: "main",
    })
    setIsDialogOpen(true)
  }

  const handleEditTable = (table) => {
    setEditingTable(table)
    setFormData({
      name: table.name,
      capacity: table.capacity.toString(),
      status: table.status,
      area: table.area,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTable = (id) => {
    setTables(tables.filter((table) => table.id !== id))
    toast.success("Table deleted successfully")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingTable) {
      // Update existing table
      setTables(
        tables.map((table) =>
          table.id === editingTable.id
            ? {
                ...table,
                name: formData.name,
                capacity: Number.parseInt(formData.capacity),
                status: formData.status,
                area: formData.area,
              }
            : table,
        ),
      )
      toast.success("Table updated successfully")
    } else {
      // Add new table
      const newTable = {
        id: tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1,
        name: formData.name,
        capacity: Number.parseInt(formData.capacity),
        status: formData.status,
        area: formData.area,
      }
      setTables([...tables, newTable])
      toast.success("Table added successfully")
    }

    setIsDialogOpen(false)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Table Management</CardTitle>
            <CardDescription>Configure tables for your restaurant</CardDescription>
          </div>
          <Button onClick={handleAddTable}>
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{table.capacity} seats</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(table.status)}`}>
                        {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{table.area}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTable(table)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {table.name}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTable(table.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
            <DialogDescription>
              {editingTable ? "Update the details for this table" : "Fill in the details to add a new table"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Table 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Select
                  value={formData.capacity}
                  onValueChange={(value) => setFormData({ ...formData, capacity: value })}
                  required
                >
                  <SelectTrigger id="capacity">
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 seat</SelectItem>
                    <SelectItem value="2">2 seats</SelectItem>
                    <SelectItem value="4">4 seats</SelectItem>
                    <SelectItem value="6">6 seats</SelectItem>
                    <SelectItem value="8">8 seats</SelectItem>
                    <SelectItem value="10">10 seats</SelectItem>
                    <SelectItem value="12">12 seats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select
                  value={formData.area}
                  onValueChange={(value) => setFormData({ ...formData, area: value })}
                  required
                >
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Dining</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="private">Private Room</SelectItem>
                    <SelectItem value="bar">Bar Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingTable ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
