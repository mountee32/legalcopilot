import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/team"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const mockUseTeamData = vi.fn();
const mockUseLeaveRequests = vi.fn();
const mockUseCreateLeave = vi.fn();
const mockUseApproveLeave = vi.fn();
const mockUseRejectLeave = vi.fn();

vi.mock("@/lib/hooks/use-team-data", () => ({
  useTeamData: (...args: any[]) => mockUseTeamData(...args),
  useLeaveRequests: (...args: any[]) => mockUseLeaveRequests(...args),
  useCreateLeave: () => mockUseCreateLeave(),
  useApproveLeave: () => mockUseApproveLeave(),
  useRejectLeave: () => mockUseRejectLeave(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("lucide-react", () => ({
  UsersRound: () => <svg data-testid="icon-UsersRound" />,
  RefreshCw: () => <svg data-testid="icon-RefreshCw" />,
  Calendar: () => <svg data-testid="icon-Calendar" />,
  Plus: () => <svg data-testid="icon-Plus" />,
  Check: () => <svg data-testid="icon-Check" />,
  X: () => <svg data-testid="icon-X" />,
}));

describe("TeamPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateLeave.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseApproveLeave.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseRejectLeave.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("renders page heading", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: null,
      workload: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("shows loading skeletons on overview tab", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: null,
      workload: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders team member cards when data loaded", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        teamMembers: [
          {
            userId: "u1",
            userName: "Jane Smith",
            userEmail: "jane@test.com",
            totalHoursAvailable: 160,
            hoursScheduled: 120,
            hoursRemaining: 40,
            utilization: 75,
            activeMatters: 5,
          },
        ],
        summary: {
          totalCapacity: 160,
          totalScheduled: 120,
          totalRemaining: 40,
          averageUtilization: 75,
        },
      },
      workload: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        teamMembers: [
          {
            userId: "u1",
            userName: "Jane Smith",
            userEmail: "jane@test.com",
            activeMatters: 5,
            upcomingDeadlines: 2,
            pendingTasks: 8,
            hoursScheduled: 120,
            workloadScore: 65,
          },
        ],
        summary: {
          totalActiveMatters: 5,
          totalUpcomingDeadlines: 2,
          totalPendingTasks: 8,
          averageWorkloadScore: 65,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@test.com")).toBeInTheDocument();
    expect(screen.getByText("5 matters")).toBeInTheDocument();
  });

  it("shows KPI cards on overview tab", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        teamMembers: [
          {
            userId: "u1",
            userName: "Test",
            userEmail: "t@t.com",
            totalHoursAvailable: 160,
            hoursScheduled: 120,
            hoursRemaining: 40,
            utilization: 75,
            activeMatters: 5,
          },
        ],
        summary: {
          totalCapacity: 160,
          totalScheduled: 120,
          totalRemaining: 40,
          averageUtilization: 75,
        },
      },
      workload: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        teamMembers: [],
        summary: {
          totalActiveMatters: 5,
          totalUpcomingDeadlines: 2,
          totalPendingTasks: 10,
          averageWorkloadScore: 65,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    expect(screen.getByText("Team Size")).toBeInTheDocument();
    expect(screen.getByText("Avg Utilisation")).toBeInTheDocument();
    expect(screen.getByText("Pending Tasks")).toBeInTheDocument();
  });

  it("switches to leave tab", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: null,
      workload: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseLeaveRequests.mockReturnValue({
      data: { leaveRequests: [], pagination: { total: 0 } },
      isLoading: false,
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    fireEvent.click(screen.getByText("Leave"));
    expect(screen.getByText("Request Leave")).toBeInTheDocument();
  });

  it("renders leave requests on leave tab", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: null,
      workload: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseLeaveRequests.mockReturnValue({
      data: {
        leaveRequests: [
          {
            id: "l1",
            firmId: "f1",
            userId: "u1",
            type: "annual",
            startDate: "2024-06-01",
            endDate: "2024-06-05",
            daysCount: 5,
            reason: "Holiday",
            status: "pending",
            decidedBy: null,
            decidedAt: null,
            decisionReason: null,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: { total: 1 },
      },
      isLoading: false,
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    fireEvent.click(screen.getByText("Leave"));
    expect(screen.getByText("Annual Leave")).toBeInTheDocument();
    expect(screen.getByText("2024-06-01 to 2024-06-05 (5 days)")).toBeInTheDocument();
  });

  it("has data-testid on root element", async () => {
    mockUseTeamData.mockReturnValue({
      capacity: null,
      workload: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const Page = (await import("@/app/(app)/team/page")).default;
    render(<Page />);
    expect(screen.getByTestId("team-page")).toBeInTheDocument();
  });
});
