import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationButton } from "@/components/app-shell/notification-button";

// Mock the notification hooks
const mockUseNotifications = vi.fn();
vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockUseNotifications(),
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

describe("NotificationButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bell icon", () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      isLoading: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationButton />
      </Wrapper>
    );

    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("shows badge when there are unread notifications", () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 5,
      notifications: [],
      isLoading: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationButton />
      </Wrapper>
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows 9+ when unread count exceeds 9", () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 15,
      notifications: [],
      isLoading: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationButton />
      </Wrapper>
    );

    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("hides badge when unread count is 0", () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      isLoading: false,
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <NotificationButton />
      </Wrapper>
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
