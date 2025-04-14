"use client"

import type React from "react"

import { useState } from "react"
import { PlusCircle, X, Edit2, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category, OrganizationState } from "@/types/organization"

interface CategoryManagerProps {
  organization: OrganizationState
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
}

export function CategoryManager({ organization, categories, setCategories }: CategoryManagerProps) {
  const [generatingCategories, setGeneratingCategories] = useState<boolean>(false)
  const [newCategory, setNewCategory] = useState<Category>({ name: "", description: "" })
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false)
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number>(-1)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleGenerateCategories = async () => {
    if (!organization.description) {
      setApiError("Please provide a business description to generate categories.")
      return
    }

    setGeneratingCategories(true)
    setApiError(null)

    try {
      const response = await fetch("/api/generate-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: organization.description }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error("Invalid response format from API.")
      }
      setCategories(data.categories)

      //eslint-disable-next-line
    } catch (error: any) {
      console.error("Error generating categories:", error)
      setApiError(error.message || "Failed to generate categories. Please try again or add them manually.")
      setCategories([]) // Clear categories on error
    } finally {
      setGeneratingCategories(false)
    }
  }

  const addCategory = () => {
    if (newCategory.name.trim() === "") return
    setCategories((prev) => [...prev, { ...newCategory, id: `temp-${Date.now()}` }]) // Add temporary ID for key prop
    setNewCategory({ name: "", description: "" })
    setIsAddingCategory(false)
  }

  const updateCategory = () => {
    if (editingCategoryIndex === -1 || newCategory.name.trim() === "") return
    setCategories((prev) =>
      prev.map((cat, index) => (index === editingCategoryIndex ? { ...newCategory, id: cat.id } : cat)),
    )
    setNewCategory({ name: "", description: "" })
    setEditingCategoryIndex(-1)
    setIsAddingCategory(false) // Close form after update
  }

  const startEditCategory = (index: number) => {
    setNewCategory({ ...categories[index] })
    setEditingCategoryIndex(index)
    setIsAddingCategory(true) // Open form for editing
  }

  const deleteCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index))
    if (editingCategoryIndex === index) {
      // If deleting the category currently being edited
      cancelEdit()
    }
  }

  const cancelEdit = () => {
    setIsAddingCategory(false)
    setEditingCategoryIndex(-1)
    setNewCategory({ name: "", description: "" })
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-orange-900 mb-1">AI-Powered Category Generation</h3>
            <p className="text-sm text-orange-700">
              Let our AI analyze your business description and suggest relevant categories for your products and
              services.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={handleGenerateCategories}
            disabled={!organization.description || generatingCategories}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
          >
            {generatingCategories ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4 min-h-[200px]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-orange-900">Your Categories</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddingCategory(true)}
            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-900"
            disabled={isAddingCategory}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <AnimatePresence>
          {categories.length > 0 ? (
            <div className="grid gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start justify-between p-4 border border-orange-200 rounded-lg bg-white hover:bg-orange-50/50 shadow-sm transition-all"
                >
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-medium text-orange-900">{category.name}</h4>
                    {category.description && <p className="mt-1 text-xs text-orange-700">{category.description}</p>}
                  </div>
                  <div className="flex flex-shrink-0 space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditCategory(index)}
                      className="text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCategory(index)}
                      className="text-orange-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center border-2 border-dashed border-orange-200 rounded-lg p-6 bg-orange-50/50">
              {generatingCategories ? (
                <div className="flex items-center gap-2 text-orange-700">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span>Generating categories...</span>
                </div>
              ) : organization.description ? (
                <div className="space-y-3">
                  <p className="text-orange-700">No categories yet.</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateCategories}
                      className="border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingCategory(true)}
                      className="border-orange-200 text-orange-700 hover:bg-orange-100"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-orange-700">
                  Add a business description in the Details tab to generate categories, or add them manually.
                </p>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Add/Edit Category Form */}
        <AnimatePresence>
          {isAddingCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-orange-100 to-amber-100">
                  <CardTitle className="text-base text-orange-900">
                    {editingCategoryIndex >= 0 ? "Edit Category" : "Add New Category"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="categoryName" className="text-orange-900">
                      Category Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Electronics"
                      required
                      className="border-orange-200 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="categoryDescription" className="text-orange-900">
                      Description (Optional)
                    </Label>
                    <Input
                      id="categoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="A short description of the category"
                      className="border-orange-200 focus-visible:ring-orange-500"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gradient-to-r from-orange-100/50 to-amber-100/50">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="text-orange-700 hover:text-orange-900 hover:bg-orange-200/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={editingCategoryIndex >= 0 ? updateCategory : addCategory}
                    disabled={!newCategory.name}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  >
                    {editingCategoryIndex >= 0 ? "Update" : "Add"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CategoryManager
