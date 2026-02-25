import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/notifications"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const mockUseNotifications = vi.fn();
const mockUseMarkAllRead = vi.fn();

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: (options: any) => mockUseNotifications(options),
  useUnreadCount: vi.fn(() => 0),
  useMarkAllRead: () => mockUseMarkAllRead(),
  useMarkRead: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("@/components/app-shell/notification-item", () => ({
  NotificationItem: ({ notification }: any) => (
    <div data-testid="notification-item">{notification.title}</div>
  ),
}));

vi.mock("@/components/ui/empty-state", () => ({
  EmptyState: ({ title, description }: any) => (
    <div>
      <span>{title}</span>
      {description && <span>{description}</span>}
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  Bell: () => <svg data-testid="icon-Bell" />,
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("renders page heading", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 0,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 0,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByText("You're all caught up — no notifications yet.")).toBeInTheDocument();
  });

  it("renders notification items when data exists", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: "n1",
          title: "Task assigned",
          type: "task_assigned",
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 1,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByTestId("notification-item")).toBeInTheDocument();
    expect(screen.getByText("Task assigned")).toBeInTheDocument();
  });

  it("shows type and read filters", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 0,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByDisplayValue("All Types")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All")).toBeInTheDocument();
  });

  it("shows Mark All Read button", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 0,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByRole("button", { name: "Mark All Read" })).toBeInTheDocument();
  });

  it("shows unread count in subtitle", async () => {
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: "n1",
          title: "T",
          type: "system",
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
      isLoading: false,
      isError: false,
      unreadCount: 3,
    });

    const Page = (await import("@/app/(app)/notifications/page")).default;
    render(<Page />);
    expect(screen.getByText("3 unread notifications")).toBeInTheDocument();
  });
});
