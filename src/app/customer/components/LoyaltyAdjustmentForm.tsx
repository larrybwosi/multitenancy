"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoyaltyReason } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useState, useTransition } from "react";
import { addManualLoyaltyTransaction } from "@/actions/customerActions";
import { toast } from "sonner";

// Zod Schema (can be imported)
const LoyaltyAdjustmentSchema = z.object({
  // customerId is passed as prop, not part of form data sent directly
  pointsChange: z.coerce
    .number()
    .int("Points must be a whole number.")
    .refine((val) => val !== 0, "Points change cannot be zero."),
  reason: z
    .nativeEnum(LoyaltyReason)
    .refine(
      (val) =>
        val === "MANUAL_ADJUSTMENT" ||
        val === "PROMOTION" ||
        val === "SIGN_UP_BONUS" ||
        val === "RETURN_ADJUSTMENT" ||
        val === "OTHER",
      { message: "Select a valid reason." }
    ),
  notes: z.string().optional(),
});

type LoyaltyFormValues = z.infer<typeof LoyaltyAdjustmentSchema>;

interface LoyaltyAdjustmentFormProps {
  customerId: string;
  currentPoints: number;
  onAdjustmentSuccess: (newPoints: number) => void; // Callback to update UI immediately
}

// Get manual adjustment reasons from Prisma enum
const manualReasons = Object.entries(LoyaltyReason)
//eslint-disable-next-line
  .filter(([key, value]) =>
    [
      "MANUAL_ADJUSTMENT",
      "PROMOTION",
      "SIGN_UP_BONUS",
      "RETURN_ADJUSTMENT",
      "OTHER",
    ].includes(value)
  )
  .map(([key, value]) => ({ label: key.replace(/_/g, " "), value }));

export function LoyaltyAdjustmentForm({
  customerId,
  currentPoints,
  onAdjustmentSuccess,
}: LoyaltyAdjustmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(LoyaltyAdjustmentSchema),
    defaultValues: {
      pointsChange: undefined,
      reason: undefined,
      notes: "",
    },
  });

  function onSubmit(data: LoyaltyFormValues) {
    setError(null);
    const formData = new FormData();
    formData.append("customerId", customerId);
    formData.append("pointsChange", data.pointsChange.toString());
    formData.append("reason", data.reason);
    if (data.notes) {
      formData.append("notes", data.notes);
    }

    startTransition(async () => {
      
      const result = await addManualLoyaltyTransaction(formData, null);

      if (result?.errors) {
        setError("Validation failed on server.");
        toast.error("Failed to adjust points. Check fields.");
      } else if (result?.message.startsWith("Error:")) {
        setError(result.message);
        toast.error(result.message);
      } else {
        toast.success(result?.message || "Points adjusted successfully!");
        if (result.newPoints !== undefined) {
          onAdjustmentSuccess(result.newPoints); // Update parent component state
        }
        form.reset(); // Reset form
      }
    });
  }

  return (
    <Card className="border-accent">
      <CardHeader>
        <CardTitle className="text-accent">Adjust Loyalty Points</CardTitle>
        <CardDescription>
          Manually add or remove points. Current balance: {currentPoints}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <FormField
              control={form.control}
              name="pointsChange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Change (+/-) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 50 or -20"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manualReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional: Add details about the adjustment"
                      className="resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending}
              variant="default"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isPending ? "Adjusting..." : "Adjust Points"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
