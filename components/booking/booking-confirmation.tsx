"use client";

import { format, parseISO } from "date-fns";
import { CheckCircle2, Calendar, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookingConfirmationProps {
  bookingId: string;
  appointmentTypeName: string;
  startAt: string;
  endAt: string;
  clientName: string;
  clientEmail: string;
  message?: string;
  onClose?: () => void;
}

export function BookingConfirmation({
  bookingId,
  appointmentTypeName,
  startAt,
  endAt,
  clientName,
  clientEmail,
  message = "Booking created successfully. You will receive a confirmation email shortly.",
  onClose,
}: BookingConfirmationProps) {
  const startDate = parseISO(startAt);
  const endDate = parseISO(endAt);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/20 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-serif text-amber-50 mb-2">Booking Confirmed</h2>
        <p className="text-slate-400">{message}</p>
      </div>

      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-serif text-amber-50 mb-4">{appointmentTypeName}</h3>
          </div>

          <div className="flex items-start gap-3 text-slate-300">
            <Calendar className="h-5 w-5 mt-0.5 text-slate-400" />
            <div>
              <p className="font-medium">{format(startDate, "EEEE, MMMM d, yyyy")}</p>
              <p className="text-sm text-slate-400">
                {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-300">
            <Clock className="h-5 w-5 mt-0.5 text-slate-400" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm text-slate-400">
                {Math.round((endDate.getTime() - startDate.getTime()) / 60000)} minutes
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-6 mb-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Your Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Name:</span>
            <span className="text-slate-200">{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="text-slate-200">{clientEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Booking ID:</span>
            <span className="text-slate-200 font-mono text-xs">{bookingId}</span>
          </div>
        </div>
      </Card>

      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-300 leading-relaxed">
          A confirmation email has been sent to <strong>{clientEmail}</strong> with all the details
          of your appointment. Please check your spam folder if you do not receive it within a few
          minutes.
        </p>
      </div>

      {onClose && (
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
        >
          Close
        </Button>
      )}
    </div>
  );
}
