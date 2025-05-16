'use client';
import { useState } from 'react';
import { Edit, Trash2, Users, MoreHorizontal, Search, X, } from 'lucide-react';
import { format } from 'date-fns';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteDepartment, useDepartments } from '@/lib/hooks/use-departments';
import { toast } from 'sonner';
import { DepartmentsSkeleton } from './loader';
import Image from 'next/image';
import CreateDepartment from './components/create-modal';
import DepartmentCard from './components/department-card';


const DepartmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, isError } = useDepartments();
  const deleteMutation = useDeleteDepartment();

  const handleDelete = async (departmentId: string) => {
    try {
      await deleteMutation.mutateAsync(departmentId);
      toast.success('Department deleted', {
        description: 'Department has been successfully removed.',
      });
    } catch (error) {
      console.log(error);
      toast.error('Error', {
        description: 'Failed to delete department',
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-[1500px]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Failed to load departments</h3>
          <p className="text-muted-foreground mt-1 mb-4">Please try again later</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <DepartmentsSkeleton />;
  }

  const filteredDepartments =
    data?.data?.items?.filter(
      dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
    console.log(filteredDepartments);
  return (
    <div className="container mx-auto py-8 px-4 max-w-[1500px]">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Departments
            </h1>
            <p className="text-muted-foreground mt-2">Manage your organization&#39;s departments and teams</p>
          </div>
          <CreateDepartment
            isOpen={isDialogOpen}
            onOpenChange={()=>setIsDialogOpen(false)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            className="pl-10 pr-10 bg-background/60 backdrop-blur-sm border-muted"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Tabs defaultValue="grid" className="w-auto" onValueChange={v => setViewMode(v as 'grid' | 'list')}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons for grid view
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden border border-border bg-card/30 backdrop-blur-sm">
                <div className="h-32 bg-muted animate-pulse" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredDepartments.length > 0 ? (
            // Departments grid
            filteredDepartments.map(dept => (
              <DepartmentCard key={dept.id} dept={dept}/>
            ))
          ) : (
            // No results for grid view
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No departments found</h3>
              <p className="text-muted-foreground mt-1 mb-4">No departments match your search criteria</p>
              <Button variant="outline" onClick={clearSearch}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      ) : (
        // List view
        <Card className="overflow-hidden border border-border bg-card/30 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Department</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Head</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Members</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Budget</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeletons for list view
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`list-skeleton-${i}`} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24" />
                      </td>
                      <td className="p-4 text-right">
                        <Skeleton className="h-9 w-9 rounded-md ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredDepartments.length > 0 ? (
                  // Departments list
                  filteredDepartments.map(dept => (
                    <tr key={`list-${dept.id}`} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {dept.image ? (
                            <Image
                              src={dept.image}
                              alt={dept.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-md object-cover border border-border/30"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                              {dept.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{dept.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                              {dept.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                              {dept.head?.name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{dept?.head?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{format(dept.createdAt, 'MMM d, yyyy')}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{dept.totalMembers}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={dept.activeBudgetId ? 'default' : 'outline'}
                          className={
                            dept.activeBudgetId
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-none text-white'
                              : ''
                          }
                        >
                          {dept.activeBudgetId ? 'Active Budget' : 'No Budget'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              <span>Manage Members</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dept.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  // No results for list view
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No departments found</h3>
                        <p className="text-muted-foreground mt-1 mb-4">No departments match your search criteria</p>
                        <Button variant="outline" onClick={clearSearch}>
                          Clear search
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DepartmentsPage;
