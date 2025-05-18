import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExtendedDepartment, useDeleteDepartment } from "@/lib/hooks/use-departments";
import { DropdownMenuContent } from "@radix-ui/react-dropdown-menu";
import { format } from "date-fns";
import { Edit, MoreHorizontal, Trash2, Users } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function DepartmentCard({ dept }: { dept: ExtendedDepartment }) {
  const { mutateAsync: deleteDepartment, isPending: deleting } = useDeleteDepartment();
console.log(dept)
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
    <Card
      key={dept.id}
      className="overflow-hidden border border-border/30 transition-all hover:shadow-lg hover:border-border/60 bg-card/30 backdrop-blur-sm"
    >
      {/* Banner Image */}
      <div
        className="h-32 bg-gradient-to-r dark:from-blue-950/30 dark:to-indigo-950/30 relative overflow-hidden"
        style={
          dept.banner
            ? {
                backgroundImage: `url(${dept.banner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}
        }
      >
        {/* Department Image/Logo as an overlay on the banner */}
        {dept.image && (
          <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full border-4 border-background shadow-md overflow-hidden">
            <Image src={dept.image} alt={dept.name} width={40} height={40} className="w-full h-full object-cover" />
          </div>
        )}
        {!dept.image && dept.banner && (
          <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full bg-primary text-primary-foreground border-4 border-background shadow-md flex items-center justify-center text-xl font-bold">
            {dept.name.charAt(0)}
          </div>
        )}
      </div>

      <CardHeader className={`pb-2 ${dept.image || dept.banner ? 'pt-10 pl-28' : ''}`}>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1 font-bold text-2xl">{dept.name}</CardTitle>
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
              <DropdownMenuItem className="text-destructive" disabled={deleting} onClick={() => handleDelete(dept.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex font-semibold items-center gap-1">
          <span>Created {format(dept.createdAt, 'MMM d, yyyy')}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-md text-muted-foreground line-clamp-3 min-h-[60px]">
          {dept.description || 'No description provided'}
        </p>

        <div className="flex items-center gap-3 ">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-blue-200 to-indigo-400 text-white">
              {dept.head?.name
                ?.split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{dept?.head?.name}</div>
            <div className="text-xs text-muted-foreground">Department Head</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-2 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{dept.totalMembers} members</span>
        </div>

        <Badge
          variant={dept.activeBudgetId ? 'default' : 'outline'}
          className={dept.activeBudgetId ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-none text-white' : ''}
        >
          {dept.activeBudgetId ? 'Active Budget' : 'No Budget'}
        </Badge>
      </CardFooter>
    </Card>
  );
}