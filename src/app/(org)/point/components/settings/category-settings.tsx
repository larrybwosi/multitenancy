"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

export function CategorySettings() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
  })

  useEffect(() => {
    // Simulate API call to fetch categories
    setTimeout(() => {
      setCategories([
        { id: 1, name: "Appetizers", description: "Starters and small plates", active: true },
        { id: 2, name: "Seafood platters", description: "Mixed seafood selections", active: true },
        { id: 3, name: "Fish", description: "Fish dishes", active: true },
        { id: 4, name: "Shrimp", description: "Shrimp specialties", active: true },
        { id: 5, name: "Crab", description: "Crab dishes", active: true },
        { id: 6, name: "Squid", description: "Squid and calamari", active: true },
        { id: 7, name: "Rice", description: "Rice dishes", active: true },
        { id: 8, name: "Drinks", description: "Beverages", active: true },
        { id: 9, name: "Dessert", description: "Sweet treats", active: true },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      description: "",
      active: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      active: category.active,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter((category) => category.id !== id))
    toast.success("Category deleted successfully")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingCategory) {
      // Update existing category
      setCategories(
        categories.map((category) =>
          category.id === editingCategory.id
            ? {
                ...category,
                name: formData.name,
                description: formData.description,
                active: formData.active,
              }
            : category,
        ),
      )
      toast.success("Category updated successfully")
    } else {
      // Add new category
      const newCategory = {
        id: categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1,
        name: formData.name,
        description: formData.description,
        active: formData.active,
      }
      setCategories([...categories, newCategory])
      toast.success("Category added successfully")
    }

    setIsDialogOpen(false)
  }

  const handleToggleActive = (id) => {
    setCategories(
      categories.map((category) => (category.id === id ? { ...category, active: !category.active } : category)),
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Configure food categories for your menu</CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <Switch checked={category.active} onCheckedChange={() => handleToggleActive(category.id)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
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
                                This will permanently delete the "{category.name}" category. This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                Delete
                              </AlertDialogAction>
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
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the details for this category" : "Fill in the details to add a new category"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Appetizers"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the category"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCategory ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
