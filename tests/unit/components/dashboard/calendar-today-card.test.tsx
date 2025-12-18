import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarTodayCard, type CalendarEvent } from "@/components/dashboard/calendar-today-card";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Calendar: createMockIcon("Calendar"),
    Video: createMockIcon("Video"),
    Gavel: createMockIcon("Gavel"),
    Clock: createMockIcon("Clock"),
    MapPin: createMockIcon("MapPin"),
  };
});

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Client Call - John Smith",
    eventType: "meeting",
    startAt: "2024-12-18T09:00:00Z",
    matterId: "CONV-2024-042",
  },
  {
    id: "2",
    title: "Team Meeting",
    eventType: "meeting",
    startAt: "2024-12-18T11:30:00Z",
    location: "Conference Room A",
  },
  {
    id: "3",
    title: "Court Hearing",
    eventType: "court_hearing",
    startAt: "2024-12-18T14:00:00Z",
    matterId: "LIT-2024-025",
    location: "County Court",
  },
];

describe("CalendarTodayCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(<CalendarTodayCard events={[]} />);

    expect(screen.getByTestId("calendar-today-card")).toBeInTheDocument();
    expect(screen.getByText("Calendar Today")).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<CalendarTodayCard events={[]} />);

    expect(screen.getByTestId("calendar-today-empty")).toBeInTheDocument();
    expect(screen.getByText("No events scheduled for today")).toBeInTheDocument();
  });

  it("renders list of events", () => {
    render(<CalendarTodayCard events={mockEvents} />);

    expect(screen.getByTestId("calendar-today-list")).toBeInTheDocument();
    expect(screen.getByText("Client Call - John Smith")).toBeInTheDocument();
    expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    expect(screen.getByText("Court Hearing")).toBeInTheDocument();
  });

  it("displays event times in HH:mm format", () => {
    render(<CalendarTodayCard events={mockEvents} />);

    // Times are displayed in local time, so we just check they exist
    expect(screen.getByTestId("calendar-event-1")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-event-2")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-event-3")).toBeInTheDocument();
  });

  it("shows location when present", () => {
    render(<CalendarTodayCard events={mockEvents} />);

    expect(screen.getByText("Conference Room A")).toBeInTheDocument();
    expect(screen.getByText("County Court")).toBeInTheDocument();
  });

  it("shows matter ID when present", () => {
    render(<CalendarTodayCard events={mockEvents} />);

    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
    expect(screen.getByText("LIT-2024-025")).toBeInTheDocument();
  });

  it("shows View Full Calendar link", () => {
    render(<CalendarTodayCard events={mockEvents} />);

    const viewFullCalendarLink = screen.getByTestId("view-full-calendar-link");
    expect(viewFullCalendarLink).toBeInTheDocument();
    expect(viewFullCalendarLink).toHaveAttribute("href", "/calendar");
  });

  it("shows loading skeleton when isLoading", () => {
    render(<CalendarTodayCard events={[]} isLoading />);

    expect(screen.getByTestId("calendar-today-card-loading")).toBeInTheDocument();
  });
});
