'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useExpenseCategories } from '@/lib/hooks/use-expense-categories';
import { Plus, Trash2, Edit, FileBarChart2, Settings, FolderKanban } from 'lucide-react';
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


const ExpenseCategoriesPage = () => {
  const { data: expenseCategories, isLoading: loadingExpenseCategories } = useExpenseCategories(true);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const EmptyState = () => (
    <div className="text-center py-16 space-y-4 border border-dashed rounded-xl bg-muted/5">
      <div className="bg-primary/5 mx-auto h-16 w-16 rounded-full flex items-center justify-center">
        <FileBarChart2 className="h-8 w-8 text-primary opacity-80" />
      </div>
      <h3 className="text-lg font-medium">No expense categories defined</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Create expense categories to organize transactions, track departmental spending, and generate accurate financial
        reports.
      </p>
      <div className="mt-6">
        <Button onClick={() => setIsAddCategoryOpen(true)} className="px-5 py-2 shadow-sm transition-all hover:shadow">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create First Category
        </Button>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="space-y-3">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
    </div>
  );

  if (loadingExpenseCategories) return <LoadingState/>
  if (!expenseCategories) return <EmptyState />;

    return (
      <div className="container mx-auto py-8 px-4 ">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between">
          <SectionHeader
            title="Expense Categories"
            subtitle="Organize, track, and analyze organizational spending patterns"
            icon={<FolderKanban className="h-8 w-8 text-indigo-500" />}
          />

          <div className="mt-4 md:mt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="rounded-md shadow-sm transition-shadow hover:shadow-md bg-primary text-white"
                    onClick={() => setIsAddCategoryOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new expense category</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border overflow-hidden shadow-sm transition-shadow hover:shadow bg-card">
            <CardHeader className="bg-muted/20 border-b px-6">
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
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[120px] font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseCategories?.map(category => (
                    <TableRow key={category.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        {category.code ? (
                          <Badge variant="outline" className="font-mono bg-primary/5 border-primary/20">
                            {category.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {category.description || <span className="text-muted-foreground italic">No description</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
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
      </div>
    );
};

export default ExpenseCategoriesPage;
