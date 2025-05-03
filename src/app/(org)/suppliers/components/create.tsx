'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Mail, Phone, MapPin, Calendar, Clock, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCreateSupplier } from '@/lib/hooks/use-supplier';

// Base schemas
const BaseStringSchema = z.string().trim();
const OptionalStringSchema = BaseStringSchema.optional().nullable();
const OptionalEmailSchema = z.string().trim().email().optional().nullable();
const OptionalNumberSchema = z.number().optional().nullable();

// Supplier schema
export const CreateSupplierPayloadSchema = z.object({
  name: BaseStringSchema.min(2, { message: 'Supplier name must be at least 2 characters.' }).max(255, {
    message: 'Supplier name must be less than 255 characters.',
  }),
  contactName: BaseStringSchema.max(100).optional().nullable(),
  email: OptionalEmailSchema,
  phone: BaseStringSchema.max(30).optional().nullable(),
  address: OptionalStringSchema,
  paymentTerms: BaseStringSchema.max(100).optional().nullable(),
  leadTime: z.preprocess(val => (val === '' ? null : Number(val)), OptionalNumberSchema),
  isActive: z.boolean().default(true),
  customFields: z.record(z.any()).optional().nullable(),
});

type FormValues = z.infer<typeof CreateSupplierPayloadSchema>;

export function CreateSupplierDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(CreateSupplierPayloadSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: '',
      leadTime: null,
      isActive: true,
      customFields: null,
    },
  });
  const { mutateAsync, isPending} = useCreateSupplier()

  async function onSubmit(data: FormValues) {
    await mutateAsync(data);
    
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Create New Supplier
          </DialogTitle>
          <DialogDescription>
            Add a new supplier to your inventory management system.
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="bg-primary/5 text-primary flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Business Details
              </Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary flex items-center gap-1">
                <User className="w-3 h-3" /> Contact Info
              </Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Payment Terms
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="space-y-4">
              {/* Supplier Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Supplier Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier company name" {...field} />
                    </FormControl>
                    <FormDescription>The official business name of the supplier.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Info Fields in One Line */}
              <div className="grid grid-cols-3 gap-4">
                {/* Contact Name Field */}
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Contact Person
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Primary contact" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" /> Email/Phone
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@supplier.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" /> Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address Field */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Address
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full supplier address"
                        className="min-h-24"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Terms and Lead Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Payment Terms Field */}
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> Payment Terms
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Net 30, COD, etc." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Standard payment terms agreed with this supplier.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Lead Time Field */}
                <FormField
                  control={form.control}
                  name="leadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Lead Time (days)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Average lead time in days"
                          value={field.value === null ? '' : (field.value ?? '')}
                          onChange={e => {
                            const value = e.target.value;
                            field.onChange(value === '' ? null : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormDescription>Average time from order placement to delivery.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Is Active Field */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" /> Active Supplier
                      </FormLabel>
                      <FormDescription>Mark as active to include in supplier lists.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Create Supplier
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
