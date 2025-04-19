"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { MemberRole } from "@prisma/client";
import EmailPreview from "./email-template";
import { createInvitation } from "@/actions/invitations";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(Object.values(MemberRole) as [MemberRole, ...MemberRole[]], {
    required_error: "Please select a role",
  }),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteMemberFormProps {
  organizationName: string;
  inviterName: string;
}

export function InviteMemberForm({
  organizationName,
  inviterName,
}: InviteMemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: MemberRole.EMPLOYEE,
      message: "",
    },
  });

  const watchEmail = form.watch("email");
  const watchRole = form.watch("role");
  const watchMessage = form.watch("message");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    console.log("Form values:", values);
    try {
      // const response = await fetch("/api/invitations", {
      //   method: "POST",
      //   body: JSON.stringify(values),
      // });

      const invitation = await createInvitation({
        inviteeEmail: values.email,
        role: values.role,
      })

      console.log(invitation);
      // form.reset();
      // setFormValues(null);

      // if (onSuccess) {
      //   onSuccess();
      // }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The email address of the person you want to invite.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MemberRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The role determines what permissions the user will have.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a personal message to include in the invitation email"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal note to the invitation email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="w-full md:w-1/2">
        <div className="sticky top-4">
          <h3 className="text-lg font-medium mb-4">Email Preview</h3>
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <EmailPreview
              inviterName={inviterName}
              organizationName={organizationName}
              recipientEmail={watchEmail}
              role={watchRole}
              customMessage={watchMessage}
              acceptUrl={`${process.env.NEXT_PUBLIC_APP_URL}/invite/token-placeholder`}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This is how the invitation email will look to the recipient.
          </p>
        </div>
      </div>
    </div>
  );
}
