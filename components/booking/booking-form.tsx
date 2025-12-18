"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const bookingFormSchema = z.object({
  clientName: z.string().min(1, "Name is required").max(200),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function BookingForm({ onSubmit, isSubmitting = false, error }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="clientName" className="text-slate-300">
          Full Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="clientName"
          {...register("clientName")}
          placeholder="John Smith"
          className="bg-slate-900/40 border-slate-800/50 text-slate-100 placeholder:text-slate-500"
          disabled={isSubmitting}
        />
        {errors.clientName && <p className="text-sm text-red-400">{errors.clientName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientEmail" className="text-slate-300">
          Email Address <span className="text-red-400">*</span>
        </Label>
        <Input
          id="clientEmail"
          type="email"
          {...register("clientEmail")}
          placeholder="john.smith@example.com"
          className="bg-slate-900/40 border-slate-800/50 text-slate-100 placeholder:text-slate-500"
          disabled={isSubmitting}
        />
        {errors.clientEmail && <p className="text-sm text-red-400">{errors.clientEmail.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientPhone" className="text-slate-300">
          Phone Number
        </Label>
        <Input
          id="clientPhone"
          type="tel"
          {...register("clientPhone")}
          placeholder="+44 20 1234 5678"
          className="bg-slate-900/40 border-slate-800/50 text-slate-100 placeholder:text-slate-500"
          disabled={isSubmitting}
        />
        {errors.clientPhone && <p className="text-sm text-red-400">{errors.clientPhone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-slate-300">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Please provide any additional information that might be helpful..."
          rows={4}
          className="bg-slate-900/40 border-slate-800/50 text-slate-100 placeholder:text-slate-500 resize-none"
          disabled={isSubmitting}
        />
        {errors.notes && <p className="text-sm text-red-400">{errors.notes.message}</p>}
        <p className="text-xs text-slate-500">Optional - Let us know how we can help you</p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      >
        {isSubmitting ? "Submitting..." : "Confirm Booking"}
      </Button>
    </form>
  );
}
