"use client"

import { useState } from "react"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Category } from "../setup-wizard"

interface CategoryReviewStepProps {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

export function CategoryReviewStep({ categories, onChange }: CategoryReviewStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Category>({ name: "", description: "", isCustom: true })
  const [isAdding, setIsAdding] = useState(false)

  const handleEdit = (id: string) => {
    setEditingId(id)
  }

  const handleSave = (index: number, updatedCategory: Category) => {
    const updatedCategories = [...categories]
    updatedCategories[index] = updatedCategory
    onChange(updatedCategories)
    setEditingId(null)
  }

  const handleDelete = (index: number) => {
    const updatedCategories = [...categories]
    updatedCategories.splice(index, 1)
    onChange(updatedCategories)
  }

  const handleAddNew = () => {
    if (newCategory.name.trim() === "") return

    onChange([...categories, newCategory])
    setNewCategory({ name: "", description: "", isCustom: true })
    setIsAdding(false)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Review Product Categories</h2>
      <p className="text-gray-600 mb-6">
        Review the generated categories, make any necessary changes, or add custom categories.
      </p>

      <div className="border rounded-lg overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Category Name</TableHead>
              <TableHead className="w-1/2">Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                  No categories yet. Add some categories or generate them.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category, index) => (
                <TableRow key={`${category.name}-${index}`}>
                  <TableCell>
                    {editingId === `${category.name}-${index}` ? (
                      <Input
                        value={category.name}
                        onChange={(e) => {
                          const updatedCategories = [...categories]
                          updatedCategories[index] = {
                            ...category,
                            name: e.target.value,
                          }
                          onChange(updatedCategories)
                        }}
                      />
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === `${category.name}-${index}` ? (
                      <Textarea
                        value={category.description}
                        onChange={(e) => {
                          const updatedCategories = [...categories]
                          updatedCategories[index] = {
                            ...category,
                            description: e.target.value,
                          }
                          onChange(updatedCategories)
                        }}
                        className="min-h-[80px]"
                      />
                    ) : (
                      category.description
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === `${category.name}-${index}` ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSave(index, category)}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(`${category.name}-${index}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}

            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Category Name"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Category Description"
                    className="min-h-[80px]"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleAddNew} disabled={!newCategory.name.trim()}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isAdding && (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Custom Category
        </Button>
      )}
    </div>
  )
}

