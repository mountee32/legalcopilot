"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { format, addDays, startOfDay } from "date-fns";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentTypeCard } from "@/components/booking/appointment-type-card";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { TimeSlotPicker } from "@/components/booking/time-slot-picker";
import { BookingForm } from "@/components/booking/booking-form";
import { BookingConfirmation } from "@/components/booking/booking-confirmation";
import { usePublicAppointmentTypes, useAvailability } from "@/lib/hooks/use-availability";
import { useCreateBooking } from "@/lib/hooks/use-create-booking";
import { useToast } from "@/lib/hooks/use-toast";

type Step = "select-type" | "select-date" | "select-time" | "enter-details" | "confirmation";

interface TimeSlot {
  startAt: string;
  endAt: string;
  appointmentTypeId: string;
  assignedTo: string | null;
}

export default function PublicBookingPage() {
  const params = useParams();
  const firmSlug = params.slug as string;
  const { toast } = useToast();

  // Booking flow state
  const [step, setStep] = useState<Step>("select-type");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    message: string;
  } | null>(null);

  // Fetch appointment types
  const { appointmentTypes, isLoading: typesLoading } = usePublicAppointmentTypes({
    firmSlug,
  });

  const selectedType = useMemo(
    () => appointmentTypes.find((t) => t.id === selectedTypeId),
    [appointmentTypes, selectedTypeId]
  );

  // Fetch availability for the next 30 days
  const startDate = useMemo(() => startOfDay(new Date()).toISOString(), []);
  const endDate = useMemo(() => addDays(new Date(), 30).toISOString(), []);

  const {
    slots,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useAvailability({
    firmSlug,
    appointmentTypeId: selectedTypeId || "",
    startDate,
    endDate,
    enabled: !!selectedTypeId,
  });

  // Group slots by date for calendar
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    slots.forEach((slot) => {
      const date = format(new Date(slot.startAt), "yyyy-MM-dd");
      dates.add(date);
    });
    return dates;
  }, [slots]);

  // Filter slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return slots.filter((slot) => {
      const slotDate = format(new Date(slot.startAt), "yyyy-MM-dd");
      return slotDate === dateStr;
    });
  }, [slots, selectedDate]);

  // Create booking mutation
  const createBooking = useCreateBooking(firmSlug);

  // Step handlers
  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep("select-date");
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("select-time");
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("enter-details");
  };

  const handleSubmitBooking = async (data: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    notes?: string;
  }) => {
    if (!selectedSlot) return;

    try {
      const result = await createBooking.mutateAsync({
        appointmentTypeId: selectedSlot.appointmentTypeId,
        startAt: selectedSlot.startAt,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        notes: data.notes,
      });

      setBookingResult(result);
      setStep("confirmation");
      toast({
        title: "Booking confirmed",
        description: result.message,
      });
    } catch (error) {
      // Error is handled by the form component
    }
  };

  const handleBack = () => {
    if (step === "select-date") {
      setStep("select-type");
      setSelectedTypeId(null);
    } else if (step === "select-time") {
      setStep("select-date");
      setSelectedSlot(null);
    } else if (step === "enter-details") {
      setStep("select-time");
    }
  };

  const handleStartOver = () => {
    setStep("select-type");
    setSelectedTypeId(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingResult(null);
  };

  // Render loading state
  if (typesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8 bg-slate-800/30" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 bg-slate-800/30" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (!typesLoading && appointmentTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-serif text-amber-50 mb-4">Booking Not Available</h1>
          <p className="text-slate-400">
            Online booking is not currently available. Please contact us directly to schedule an
            appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50 mb-2">
            Book an Appointment
          </h1>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent" />
        </div>

        {/* Progress Steps */}
        {step !== "confirmation" && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { key: "select-type", label: "Type", number: 1 },
                { key: "select-date", label: "Date", number: 2 },
                { key: "select-time", label: "Time", number: 3 },
                { key: "enter-details", label: "Details", number: 4 },
              ].map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step === s.key
                        ? "bg-amber-600 text-white"
                        : i <
                            ["select-type", "select-date", "select-time", "enter-details"].indexOf(
                              step
                            )
                          ? "bg-green-900/30 text-green-400"
                          : "bg-slate-800/30 text-slate-500"
                    }`}
                  >
                    {i <
                    ["select-type", "select-date", "select-time", "enter-details"].indexOf(step) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{s.number}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      step === s.key ? "text-amber-50 font-medium" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < 3 && (
                    <div
                      className={`w-12 h-[2px] mx-4 ${
                        i <
                        ["select-type", "select-date", "select-time", "enter-details"].indexOf(step)
                          ? "bg-green-900/30"
                          : "bg-slate-800/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm mb-6">
          {step === "select-type" && (
            <div className="p-6">
              <h2 className="text-xl font-serif text-amber-50 mb-4">Select Appointment Type</h2>
              <div className="space-y-3">
                {appointmentTypes.map((type) => (
                  <AppointmentTypeCard
                    key={type.id}
                    id={type.id}
                    name={type.name}
                    description={type.description}
                    practiceArea={type.practiceArea}
                    duration={type.duration}
                    selected={selectedTypeId === type.id}
                    onClick={() => handleSelectType(type.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === "select-date" && selectedType && (
            <div className="p-6">
              <h2 className="text-xl font-serif text-amber-50 mb-1">Select Date</h2>
              <p className="text-sm text-slate-400 mb-4">
                Appointment: {selectedType.name} ({selectedType.duration} mins)
              </p>
              <AvailabilityCalendar
                selectedDate={selectedDate}
                onDateSelect={handleSelectDate}
                availableDates={availableDates}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
              />
            </div>
          )}

          {step === "select-time" && selectedDate && selectedType && (
            <div>
              <div className="p-6 border-b border-slate-800/50">
                <h2 className="text-xl font-serif text-amber-50 mb-1">Select Time</h2>
                <p className="text-sm text-slate-400">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} - {selectedType.name}
                </p>
              </div>
              <TimeSlotPicker
                slots={slotsForSelectedDate}
                selectedSlot={selectedSlot}
                onSlotSelect={handleSelectSlot}
                isLoading={slotsLoading}
              />
            </div>
          )}

          {step === "enter-details" && selectedSlot && selectedType && (
            <div className="p-6">
              <h2 className="text-xl font-serif text-amber-50 mb-1">Your Details</h2>
              <p className="text-sm text-slate-400 mb-6">
                {format(new Date(selectedSlot.startAt), "EEEE, MMMM d, yyyy 'at' h:mm a")} -{" "}
                {selectedType.name}
              </p>
              <BookingForm
                onSubmit={handleSubmitBooking}
                isSubmitting={createBooking.isPending}
                error={createBooking.error?.message}
              />
            </div>
          )}

          {step === "confirmation" && bookingResult && selectedSlot && selectedType && (
            <BookingConfirmation
              bookingId={bookingResult.bookingId}
              appointmentTypeName={selectedType.name}
              startAt={selectedSlot.startAt}
              endAt={selectedSlot.endAt}
              clientName=""
              clientEmail=""
              message={bookingResult.message}
              onClose={handleStartOver}
            />
          )}
        </Card>

        {/* Navigation Buttons */}
        {step !== "confirmation" && step !== "select-type" && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
