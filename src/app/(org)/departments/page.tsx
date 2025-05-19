'use client';
import { useState } from 'react';
import { Edit, Trash2, Users, MoreHorizontal, Search, X, Group, Grid, List,  Plus } from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence } from 'framer-motion';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useDeleteDepartment, useDepartments } from '@/lib/hooks/use-departments';
import { toast } from 'sonner';
import { DepartmentsSkeleton } from './loader';
import Image from 'next/image';
import CreateDepartment from './components/create-modal';
import DepartmentCard from './components/department-card';
import { useQueryState } from 'nuqs';
import { MotionButton, MotionDiv, MotionH2, MotionP, MotionTr } from '@/components/motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const DepartmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useQueryState('modal', {
    parse: v => v === 'true',
    serialize: v => (v ? 'true' : 'false'),
  });
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
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto py-8 px-4 max-w-[1500px]"
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="rounded-full bg-destructive/10 p-6 mb-6"
          >
            <X className="h-12 w-12 text-destructive" />
          </MotionDiv>
          <MotionH2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold"
          >
            Failed to load departments
          </MotionH2>
          <MotionP
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2 mb-6"
          >
            Please try again later
          </MotionP>
          <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </MotionDiv>
        </div>
      </MotionDiv>
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

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto py-8 px-2 max-w-[1500px] space-y-8"
    >
      {/* Header Section */}
      <MotionDiv variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/30">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Group className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                  <p className="text-muted-foreground mt-1">Manage your organization&apos;s departments and teams</p>
                </div>
              </div>
              <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => setIsDialogOpen(true)} size="lg" className="shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Department
                </Button>
              </MotionDiv>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>

      {/* Controls Section */}
      <MotionDiv variants={itemVariants}>
        <Card >
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  className="pl-10 pr-10 border-border/60 focus:border-primary/60"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <AnimatePresence>
                  {searchQuery && (
                    <MotionButton
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </MotionButton>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3">
                <Separator orientation="vertical" className="h-6" />

                {/* View Toggle */}
                <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'grid' | 'list')}>
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="grid" className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Stats */}
                <div className="text-sm text-muted-foreground">
                  {filteredDepartments.length} of {data?.data?.items?.length || 0} departments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>

      {/* Content Section */}
      <MotionDiv variants={itemVariants}>
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <MotionDiv
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredDepartments.length > 0 ? (
                <MotionDiv
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredDepartments.map((dept, index) => (
                    <MotionDiv
                      key={dept.id}
                      variants={itemVariants}
                      custom={index}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <DepartmentCard dept={dept} />
                    </MotionDiv>
                  ))}
                </MotionDiv>
              ) : (
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className="rounded-full bg-muted p-6 mb-6"
                      >
                        <Search className="h-12 w-12 text-muted-foreground" />
                      </MotionDiv>
                      <h3 className="text-xl font-semibold">No departments found</h3>
                      <p className="text-muted-foreground mt-2 mb-6">
                        {searchQuery
                          ? 'No departments match your search criteria'
                          : 'Get started by creating your first department'}
                      </p>
                      <div className="flex gap-3">
                        {searchQuery && (
                          <Button variant="outline" onClick={clearSearch}>
                            Clear search
                          </Button>
                        )}
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Department
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>
              )}
            </MotionDiv>
          ) : (
            <MotionDiv
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden border-border/40">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">Department</th>
                        <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">Head</th>
                        <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">Created</th>
                        <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">Members</th>
                        <th className="h-14 px-6 text-left align-middle font-semibold text-foreground">Budget</th>
                        <th className="h-14 px-6 text-right align-middle font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {filteredDepartments.length > 0 ? (
                          filteredDepartments.map((dept, index) => (
                            <MotionTr
                              key={dept.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="border-b hover:bg-muted/50 transition-colors"
                              whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                            >
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <MotionDiv whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                                    {dept.image ? (
                                      <div className="relative overflow-hidden rounded-lg">
                                        <Image
                                          src={dept.image}
                                          alt={dept.name}
                                          width={48}
                                          height={48}
                                          className="h-12 w-12 object-cover border border-border/20"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-border/20">
                                        <span className="text-lg font-semibold text-primary">
                                          {dept.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </MotionDiv>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-foreground">{dept.name}</div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {dept.description || 'No description provided'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 ring-1 ring-border/20">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                      {dept.head?.name
                                        ?.split(' ')
                                        .map(n => n[0])
                                        .join('') || 'NH'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{dept?.head?.name || 'Not assigned'}</span>
                                </div>
                              </td>
                              <td className="p-6 text-muted-foreground">{format(dept.createdAt, 'MMM d, yyyy')}</td>
                              <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{dept.totalMembers}</span>
                                  <span className="text-muted-foreground">
                                    {dept.totalMembers === 1 ? 'member' : 'members'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-6">
                                <Badge
                                  variant={dept.activeBudgetId ? 'default' : 'secondary'}
                                  className={
                                    dept.activeBudgetId
                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
                                  }
                                >
                                  {dept.activeBudgetId ? 'Active Budget' : 'No Budget'}
                                </Badge>
                              </td>
                              <td className="p-6 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </MotionDiv>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Department
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Users className="mr-2 h-4 w-4" />
                                      Manage Members
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDelete(dept.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Department
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </MotionTr>
                          ))
                        ) : (
                          <MotionTr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <td colSpan={6} className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <MotionDiv
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                  className="rounded-full bg-muted p-6 mb-6"
                                >
                                  <Search className="h-12 w-12 text-muted-foreground" />
                                </MotionDiv>
                                <h3 className="text-xl font-semibold">No departments found</h3>
                                <p className="text-muted-foreground mt-2 mb-6">
                                  {searchQuery
                                    ? 'No departments match your search criteria'
                                    : 'Get started by creating your first department'}
                                </p>
                                <div className="flex gap-3">
                                  {searchQuery && (
                                    <Button variant="outline" onClick={clearSearch}>
                                      Clear search
                                    </Button>
                                  )}
                                  <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Department
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </MotionTr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionDiv>

      {/* Modal */}
      <CreateDepartment isOpen={isDialogOpen as boolean} onOpenChange={setIsDialogOpen} />
    </MotionDiv>
  );
};

export default DepartmentsPage;
