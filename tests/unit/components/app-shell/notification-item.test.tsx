import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationItem } from "@/components/app-shell/notification-item";
import type { Notification } from "@/lib/db/schema";

// Mock the notification hooks
const mockUseMarkRead = vi.fn();
vi.mock("@/lib/hooks/use-notifications", () => ({
  useMarkRead: () => mockUseMarkRead(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockUnreadNotification: Notification = {
  id: "notif-1",
  firmId: "firm-1",
  userId: "user-1",
  type: "task_assigned",
  title: "New task assigned",
  body: "You have been assigned a task",
  read: false,
  readAt: null,
  link: "/tasks/1",
  channels: null,
  metadata: null,
  createdAt: new Date("2024-12-18T10:00:00Z"),
};

const mockReadNotification: Notification = {
  ...mockUnreadNotification,
  id: "notif-2",
  read: true,
  readAt: new Date("2024-12-18T11:00:00Z"),
};

describe("NotificationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMarkRead.mockReturnValue({
      mutate: vi.fn(),
    });
  });

  it("renders notification title", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    expect(screen.getByText("New task assigned")).toBeInTheDocument();
  });

  it("renders notification body when present", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    expect(screen.getByText("You have been assigned a task")).toBeInTheDocument();
  });

  it("does not render body when null", () => {
    const notificationWithoutBody = { ...mockUnreadNotification, body: null };
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={notificationWithoutBody} />
      </Wrapper>
    );

    expect(screen.queryByText("You have been assigned a task")).not.toBeInTheDocument();
  });

  it("shows unread indicator for unread notifications", () => {
    const Wrapper = createWrapper();
    const { container } = render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    // Check for the blue dot indicator
    const indicator = container.querySelector(".bg-blue-500");
    expect(indicator).toBeInTheDocument();
  });

  it("does not show unread indicator for read notifications", () => {
    const Wrapper = createWrapper();
    const { container } = render(
      <Wrapper>
        <NotificationItem notification={mockReadNotification} />
      </Wrapper>
    );

    // Check for the blue dot indicator
    const indicator = container.querySelector(".bg-blue-500");
    expect(indicator).not.toBeInTheDocument();
  });

  it("applies unread background styling", () => {
    const Wrapper = createWrapper();
    const { container } = render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    const notificationDiv = container.querySelector(".bg-muted\\/30");
    expect(notificationDiv).toBeInTheDocument();
  });

  it("calls markRead when clicked and unread", () => {
    const mockMutate = vi.fn();
    mockUseMarkRead.mockReturnValue({
      mutate: mockMutate,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    const notification = screen.getByText("New task assigned").closest("div");
    if (notification) {
      fireEvent.click(notification);
    }

    expect(mockMutate).toHaveBeenCalledWith("notif-1");
  });

  it("does not call markRead when clicked and already read", () => {
    const mockMutate = vi.fn();
    mockUseMarkRead.mockReturnValue({
      mutate: mockMutate,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockReadNotification} />
      </Wrapper>
    );

    const notification = screen.getByText("New task assigned").closest("div");
    if (notification) {
      fireEvent.click(notification);
    }

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("wraps in link when link is present", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/tasks/1");
  });

  it("does not wrap in link when link is null", () => {
    const notificationWithoutLink = { ...mockUnreadNotification, link: null };
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={notificationWithoutLink} />
      </Wrapper>
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders correct icon for task_assigned type", () => {
    const Wrapper = createWrapper();
    const { container } = render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    // Check that an icon is rendered (we don't test specific icon components)
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationItem notification={mockUnreadNotification} />
      </Wrapper>
    );

    // Should render something like "X hours ago" or similar
    const timestamp = screen.getByText(/ago$/);
    expect(timestamp).toBeInTheDocument();
  });
});
