import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExtendedDepartment, useDeleteDepartment } from '@/lib/hooks/use-departments';
import { DropdownMenuContent } from '@radix-ui/react-dropdown-menu';
import { format } from 'date-fns';
import { Edit, MoreHorizontal, Trash2, Users, Calendar, User } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function DepartmentCard({ dept }: { dept: ExtendedDepartment }) {
  const { mutateAsync: deleteDepartment, isPending: deleting } = useDeleteDepartment();

  const handleDelete = async (departmentId: string) => {
    try {
      await deleteDepartment(departmentId);
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

  return (
    <Card className="group border border-border/40 transition-all duration-200 hover:shadow-md hover:border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Department Logo/Image */}
            <div className="relative">
              {dept.image ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/20 bg-muted/50">
                  <Image
                    src={dept.image}
                    alt={dept.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/5 border border-border/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">{dept.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {dept.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Created {format(dept.createdAt, 'MMM d, yyyy')}
              </CardDescription>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
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
                disabled={deleting}
                onClick={() => handleDelete(dept.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Department
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {dept.description || 'No description provided'}
        </p>

        {/* Department Head */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
          <Avatar className="h-9 w-9 ring-1 ring-border/20">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {dept.head?.name
                ?.split(' ')
                .map(n => n[0])
                .join('') || 'DH'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{dept?.head?.name || 'Not assigned'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Department Head
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          {/* Member Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{dept.totalMembers}</span>
              <span>{dept.totalMembers === 1 ? 'member' : 'members'}</span>
            </div>
          </div>

          {/* Budget Status */}
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
        </div>
      </CardFooter>
    </Card>
  );
}
