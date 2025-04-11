"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Customer } from "@prisma/client";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveCustomer } from "@/actions/customers.actions";

// Zod Schema
const CustomerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

interface CustomerFormProps {
  customer?: Customer | null; // For editing
  onFormSubmit: () => void; // Callback to close dialog/modal
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
    },
  }),
};

export function CustomerForm({ customer, onFormSubmit }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!customer;

  const form = useForm({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
      isActive: customer?.isActive ?? true, // Default to true if new
    },
  });

  function onSubmit(data: CustomerFormValues) {
    setError(null);
    const formData = new FormData();
    if (isEditing && customer?.id) {
      formData.append("id", customer.id);
    }
    formData.append("name", data.name);
    formData.append("isActive", data.isActive.toString()); // Send as string 'true'/'false'
    if (data.email) formData.append("email", data.email);
    if (data.phone) formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.notes) formData.append("notes", data.notes);

    startTransition(async () => {
      const result = await saveCustomer(formData);
      if (result?.errors) {
        setError("Validation failed on server.");
        toast.error("Failed to save customer. Check fields.");
      } else if (result?.message) {
        setError(result?.message|| 'Failed to save customer');
        toast.error("Failed to save customer", {
          description: result?.message,
          duration:5000
        });
      } else {
        toast.success(
          result?.message ||
            (isEditing ? "Customer updated!" : "Customer created!")
        );
        form.reset(
          isEditing
            ? data
            : {
                name: "",
                email: "",
                phone: "",
                address: "",
                notes: "",
                isActive: true,
              }
        ); // Reset form
        onFormSubmit(); // Close dialog
      }
    });
  }

  return (
    <Card className="w-full border-none shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          {isEditing ? "Edit Customer" : "New Customer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
              >
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          disabled={isPending}
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </motion.div>
            </div>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 234 567 890"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Address
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, Anytown..."
                        {...field}
                        value={field.value ?? ""}
                        className="resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200 min-h-24"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes about the customer..."
                        {...field}
                        value={field.value ?? ""}
                        className="resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200 min-h-24"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                    <div className="space-y-1">
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        Active Status
                      </FormLabel>
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                        Inactive customers cannot make new purchases.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div
              className="flex justify-end pt-6"
              custom={6}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </span>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Customer"
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
