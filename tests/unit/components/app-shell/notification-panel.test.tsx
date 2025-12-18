import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationPanel } from "@/components/app-shell/notification-panel";

// Mock the notification hooks
const mockUseNotifications = vi.fn();
const mockUseMarkAllRead = vi.fn();
const mockUseMarkRead = vi.fn();
vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: (options: any) => mockUseNotifications(options),
  useMarkAllRead: () => mockUseMarkAllRead(),
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

const mockNotifications = [
  {
    id: "notif-1",
    type: "task_assigned",
    title: "New task assigned",
    body: "You have been assigned a task",
    read: false,
    link: "/tasks/1",
    createdAt: "2024-12-18T10:00:00Z",
  },
  {
    id: "notif-2",
    type: "email_received",
    title: "New email",
    body: null,
    read: false,
    link: null,
    createdAt: "2024-12-18T09:00:00Z",
  },
];

describe("NotificationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: true,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.getByText("No new notifications")).toBeInTheDocument();
  });

  it("renders notification list", () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.getByText("New task assigned")).toBeInTheDocument();
    expect(screen.getByText("New email")).toBeInTheDocument();
  });

  it("shows Mark All Read button when notifications exist", () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.getByText("Mark All Read")).toBeInTheDocument();
  });

  it("calls markAllRead when button clicked", () => {
    const mockMutate = vi.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    const button = screen.getByText("Mark All Read");
    fireEvent.click(button);

    expect(mockMutate).toHaveBeenCalled();
  });

  it("disables Mark All Read button when pending", () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    const button = screen.getByText("Mark All Read");
    expect(button).toBeDisabled();
  });

  it("shows View All button when notifications exist", () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.getByText("View All Notifications")).toBeInTheDocument();
  });

  it("hides Mark All Read and View All when no notifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(screen.queryByText("Mark All Read")).not.toBeInTheDocument();
    expect(screen.queryByText("View All Notifications")).not.toBeInTheDocument();
  });

  it("passes correct options to useNotifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
    });
    mockUseMarkAllRead.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationPanel />
      </Wrapper>
    );

    expect(mockUseNotifications).toHaveBeenCalledWith({ limit: 10, read: false });
  });
});
