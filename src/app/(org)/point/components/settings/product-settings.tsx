"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, Filter, ChevronDown } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

export function ProductSettings() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    variants: "",
    active: true,
    image: "",
  })

  useEffect(() => {
    // Simulate API call to fetch products and categories
    setTimeout(() => {
      setCategories([
        { id: 1, name: "Appetizers" },
        { id: 2, name: "Seafood platters" },
        { id: 3, name: "Fish" },
        { id: 4, name: "Shrimp" },
        { id: 5, name: "Crab" },
        { id: 6, name: "Squid" },
        { id: 7, name: "Rice" },
        { id: 8, name: "Drinks" },
        { id: 9, name: "Dessert" },
      ])

      setProducts([
        {
          id: 1,
          name: "Spring Rolls",
          description: "Crispy spring rolls filled with vegetables",
          price: 45000,
          category: "Appetizers",
          variants: ["Original", "Spicy"],
          active: true,
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: 2,
          name: "Calamari Rings",
          description: "Crispy fried calamari rings with dipping sauce",
          price: 65000,
          category: "Appetizers",
          variants: ["Original", "Garlic"],
          active: true,
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: 3,
          name: "Mixed Seafood Platter",
          description: "Assortment of fresh seafood",
          price: 250000,
          category: "Seafood platters",
          variants: ["Small", "Medium", "Large"],
          active: true,
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: 4,
          name: "Spicy shrimp with rice",
          description: "Spicy shrimp served with steamed rice",
          price: 70000,
          category: "Shrimp",
          variants: ["Original", "Extra spicy"],
          active: true,
          image: "/placeholder.svg?height=200&width=300",
        },
        {
          id: 5,
          name: "Thai hot seafood soup",
          description: "Spicy Thai-style seafood soup",
          price: 80000,
          category: "Seafood platters",
          variants: ["Original", "Tom yum"],
          active: true,
          image: "/placeholder.svg?height=200&width=300",
        },
      ])

      setIsLoading(false)
    }, 1000)
  }, [])

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      variants: "",
      active: true,
      image: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      variants: product.variants.join(", "),
      active: product.active,
      image: product.image,
    })
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = (id) => {
    setProducts(products.filter((product) => product.id !== id))
    toast.success("Product deleted successfully")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const variants = formData.variants
      .split(",")
      .map((variant) => variant.trim())
      .filter((variant) => variant !== "")

    if (editingProduct) {
      // Update existing product
      setProducts(
        products.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                name: formData.name,
                description: formData.description,
                price: Number.parseFloat(formData.price),
                category: formData.category,
                variants,
                active: formData.active,
                image: formData.image || "/placeholder.svg?height=200&width=300",
              }
            : product,
        ),
      )
      toast.success("Product updated successfully")
    } else {
      // Add new product
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        variants,
        active: formData.active,
        image: formData.image || "/placeholder.svg?height=200&width=300",
      }
      setProducts([...products, newProduct])
      toast.success("Product added successfully")
    }

    setIsDialogOpen(false)
  }

  const handleToggleActive = (id) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, active: !product.active } : product)))
  }

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((product) => categoryFilter === "all" || product.category === categoryFilter)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>Configure products for your menu</CardDescription>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Category: {categoryFilter === "all" ? "All" : categoryFilter}</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All Categories</DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} onClick={() => setCategoryFilter(category.name)}>
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.variants.join(", ")}</TableCell>
                    <TableCell>
                      <Switch checked={product.active} onCheckedChange={() => handleToggleActive(product.id)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
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
                                This will permanently delete "{product.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the details for this product" : "Fill in the details to add a new product"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spring Rolls"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 45000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variants">Variants (comma separated)</Label>
                <Input
                  id="variants"
                  value={formData.variants}
                  onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
                  placeholder="e.g., Original, Spicy, Large"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the product"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="e.g., /images/product.jpg"
                />
                <p className="text-xs text-muted-foreground">Leave blank to use a placeholder image</p>
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
              <Button type="submit">{editingProduct ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
