"use client";

import { format } from "date-fns";
import { useAuth } from "@/components/providers/auth-provider";

interface DashboardGreetingProps {
  date?: Date;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ date = new Date() }: DashboardGreetingProps) {
  const { session } = useAuth();

  const userName = session?.user?.name?.split(" ")[0] || "there";
  const greeting = getGreeting(date.getHours());
  const formattedDate = format(date, "EEE d MMM yyyy");

  return (
    <div
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      data-testid="dashboard-greeting"
    >
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        {greeting}, {userName}
      </h1>
      <p className="text-muted-foreground" data-testid="dashboard-date">
        {formattedDate}
      </p>
    </div>
  );
}
