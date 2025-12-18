"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Clock, Calendar, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/lib/hooks/use-toast";
import {
  useAppointmentTypes,
  useCreateAppointmentType,
  useDeleteAppointmentType,
} from "@/lib/hooks/use-appointment-types";
import {
  useAvailabilityRules,
  useCreateAvailabilityRule,
  useDeleteAvailabilityRule,
} from "@/lib/hooks/use-availability-rules";
import { Dialog } from "@/components/ui/dialog";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function BookingSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("appointment-types");

  const {
    appointmentTypes,
    isLoading: typesLoading,
    refetch: refetchTypes,
  } = useAppointmentTypes();

  const {
    availabilityRules,
    isLoading: rulesLoading,
    refetch: refetchRules,
  } = useAvailabilityRules();

  const createType = useCreateAppointmentType();
  const deleteType = useDeleteAppointmentType();

  const createRule = useCreateAvailabilityRule();
  const deleteRule = useDeleteAvailabilityRule();

  const handleDeleteType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment type?")) return;

    try {
      await deleteType.mutateAsync(id);
      toast({
        title: "Success",
        description: "Appointment type deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment type",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability rule?")) return;

    try {
      await deleteRule.mutateAsync(id);
      toast({
        title: "Success",
        description: "Availability rule deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete availability rule",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Booking Settings
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Appointments & Availability
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/40 border border-slate-800/50">
            <TabsTrigger value="appointment-types" className="data-[state=active]:bg-amber-900/30">
              <Calendar className="h-4 w-4 mr-2" />
              Appointment Types
            </TabsTrigger>
            <TabsTrigger value="availability" className="data-[state=active]:bg-amber-900/30">
              <Clock className="h-4 w-4 mr-2" />
              Availability Rules
            </TabsTrigger>
          </TabsList>

          {/* Appointment Types Tab */}
          <TabsContent value="appointment-types" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Manage the types of appointments clients can book
              </p>
              <Button
                size="sm"
                className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </div>

            {typesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 bg-slate-800/30" />
                ))}
              </div>
            ) : appointmentTypes.length === 0 ? (
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-serif text-amber-50 mb-2">No Appointment Types</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Create your first appointment type to start accepting bookings
                  </p>
                  <Button
                    size="sm"
                    className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Appointment Type
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointmentTypes.map((type) => (
                  <Card
                    key={type.id}
                    className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-6 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-serif text-amber-50">{type.name}</h3>
                          {!type.isActive && (
                            <Badge
                              variant="outline"
                              className="bg-slate-700/20 border-slate-700/30 text-slate-400 text-xs"
                            >
                              Inactive
                            </Badge>
                          )}
                          {type.practiceArea && (
                            <Badge
                              variant="outline"
                              className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
                            >
                              {type.practiceArea}
                            </Badge>
                          )}
                        </div>
                        {type.description && (
                          <p className="text-sm text-slate-400 mb-3">{type.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{type.duration} mins</span>
                          </div>
                          {type.bufferAfter > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span>+ {type.bufferAfter} min buffer</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span>{type.minNoticeHours}h notice required</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-amber-50 hover:bg-slate-800/50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteType(type.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Availability Rules Tab */}
          <TabsContent value="availability" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">Define when appointments can be booked</p>
              <Button
                size="sm"
                className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            {rulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 bg-slate-800/30" />
                ))}
              </div>
            ) : availabilityRules.length === 0 ? (
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-lg font-serif text-amber-50 mb-2">No Availability Rules</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Create availability rules to define when appointments can be booked
                  </p>
                  <Button
                    size="sm"
                    className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Availability Rule
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {availabilityRules.map((rule) => (
                  <Card
                    key={rule.id}
                    className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-6 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {rule.isUnavailable ? (
                            <Badge
                              variant="outline"
                              className="bg-red-900/20 border-red-900/30 text-red-100 text-xs"
                            >
                              Unavailable
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-900/20 border-green-900/30 text-green-100 text-xs"
                            >
                              Available
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-300">
                          {rule.specificDate ? (
                            <p>
                              <span className="text-amber-50 font-medium">Specific Date:</span>{" "}
                              {new Date(rule.specificDate).toLocaleDateString()}
                            </p>
                          ) : rule.dayOfWeek !== null ? (
                            <p>
                              <span className="text-amber-50 font-medium">
                                {DAYS_OF_WEEK.find((d) => d.value === rule.dayOfWeek)?.label}:
                              </span>{" "}
                              {rule.startTime && rule.endTime
                                ? `${rule.startTime} - ${rule.endTime}`
                                : "All day"}
                            </p>
                          ) : (
                            <p className="text-slate-400">No schedule defined</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-amber-50 hover:bg-slate-800/50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-blue-950/20 to-blue-900/10 border-blue-800/30 backdrop-blur-sm mt-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <Settings2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-amber-50 mb-2">Booking Configuration</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Appointment types define what clients can book. Availability rules control when
                  appointments can be scheduled. You can create recurring weekly schedules or
                  specific date overrides for holidays and special events.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
