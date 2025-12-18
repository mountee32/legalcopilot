"use client";

import { useMutation } from "@tanstack/react-query";

interface CreateBookingData {
  appointmentTypeId: string;
  startAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  captchaToken?: string;
}

interface CreateBookingResponse {
  success: true;
  bookingId: string;
  message: string;
}

export function useCreateBooking(firmSlug: string) {
  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const res = await fetch(`/api/public/booking/firms/${firmSlug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || error.error || "Failed to create booking");
      }

      return res.json() as Promise<CreateBookingResponse>;
    },
  });
}
