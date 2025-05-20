import { SelectContent } from "@radix-ui/react-select";
import { Select, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, Separator } from "./ui";
import { Loader2 } from "lucide-react";
import { useMembers } from "@/lib/hooks/use-org";

interface MembersSelectProps {
  value?:string 
  onChange:(v:string)=> void;
}
export default function MembersSelect({ value, onChange}: MembersSelectProps) {
    const { data: members, isLoading } = useMembers();
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select Member'} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Choose a member</SelectLabel>
          <Separator />
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            members?.map(member => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}