'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useExpenseCategories } from '@/lib/hooks/use-expense-categories';
import { Plus, Trash2, Edit, FileBarChart2, Settings, FolderKanban, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { AddCategoryModal } from '../../settings/add-expense-category-modal';
import { DeleteCategoryModal } from '../../settings/delete-category-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { EditCategoryModal } from './eddit-category';
import { MotionDiv, MotionTr } from '@/components/motion';
import { ExpenseCategory } from '@/types/finance';

const ExpenseCategoriesPage = () => {
  const { data: expenseCategories, isLoading: loadingExpenseCategories } = useExpenseCategories(true);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  
  const handleEditClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };


  const EmptyState = () => (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16 space-y-4 border border-dashed rounded-xl bg-gradient-to-br from-muted/5 to-muted/20"
    >
      <MotionDiv
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="bg-primary/5 mx-auto h-16 w-16 rounded-full flex items-center justify-center"
      >
        <FileBarChart2 className="h-8 w-8 text-primary opacity-80" />
      </MotionDiv>
      <h3 className="text-lg font-medium">No expense categories defined</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Create expense categories to organize transactions, track departmental spending, and generate accurate financial
        reports.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => setIsAddCategoryOpen(true)}
          className="px-5 py-2 shadow-sm transition-all hover:shadow-md bg-gradient-to-r from-primary to-primary/90 text-white"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create First Category
        </Button>
      </div>
    </MotionDiv>
  );

  const LoadingState = () => (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center space-x-4 p-4 bg-muted/5 rounded-lg"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </MotionDiv>
        ))}
    </div>
  );

  if (loadingExpenseCategories) return <LoadingState />;
  if (!expenseCategories) return <EmptyState />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <SectionHeader
          title="Expense Categories"
          subtitle="Organize, track, and analyze organizational spending patterns"
          icon={
            <MotionDiv
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FolderKanban className="h-8 w-8 text-indigo-500" />
            </MotionDiv>
          }
        />

        <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4 md:mt-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-lg shadow-sm transition-all hover:shadow-md bg-gradient-to-r from-primary to-primary/90 text-white"
                  onClick={() => setIsAddCategoryOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Add a new expense category</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </MotionDiv>
      </div>

      <div className="grid gap-6">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border overflow-hidden shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="bg-gradient-to-r from-muted/10 to-muted/5 border-b px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center text-xl">
                    <Settings className="h-5 w-5 mr-2 text-primary" />
                    Category Management
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Define, organize, and maintain your organization&#39;s expense classification system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="w-[200px] font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseCategories?.map(category => (
                    <MotionTr
                      key={category.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                      onHoverStart={() => setHoveredRow(category.id)}
                      onHoverEnd={() => setHoveredRow(null)}
                      className={cn(
                        'border-t transition-colors',
                        hoveredRow === category.id ? 'bg-muted/10' : 'bg-background'
                      )}
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-4 w-4 text-primary" />
                          </div>
                          <span>{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {category.code ? (
                          <Badge variant="outline" className="font-mono bg-primary/5 border-primary/20 px-2 py-1">
                            {category.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md text-sm py-4">
                        {category.description || <span className="text-muted-foreground italic">No description</span>}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/30">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-lg shadow-lg">
                            <DropdownMenuItem className="cursor-pointer focus:bg-muted/20" onClick={()=>handleEditClick(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => {
                                setCategoryToDelete(category.id);
                                setIsDeleteCategoryOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </MotionTr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </MotionDiv>
      </div>

      {/* Modals */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogTrigger asChild>
          <span className="hidden">Add Category</span>
        </DialogTrigger>
        <AddCategoryModal open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen} onSuccess={() => {}} />
      </Dialog>

      <DeleteCategoryModal
        open={isDeleteCategoryOpen}
        onOpenChange={setIsDeleteCategoryOpen}
        categoryId={categoryToDelete}
        onSuccess={() => {}}
      />

      <EditCategoryModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        category={selectedCategory}
        onSuccess={() => {
          // Refresh your data
        }}
      />
    </div>
  );
};

export default ExpenseCategoriesPage;
