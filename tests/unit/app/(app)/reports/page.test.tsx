import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/reports"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const mockUseDashboardReport = vi.fn();
const mockUseProductivityReport = vi.fn();
const mockUseBillingReport = vi.fn();
const mockUseMatterReport = vi.fn();
const mockUseFunnelReport = vi.fn();

vi.mock("@/lib/hooks/use-reports-data", () => ({
  useDashboardReport: (...args: any[]) => mockUseDashboardReport(...args),
  useProductivityReport: (...args: any[]) => mockUseProductivityReport(...args),
  useBillingReport: (...args: any[]) => mockUseBillingReport(...args),
  useMatterReport: (...args: any[]) => mockUseMatterReport(...args),
  useFunnelReport: (...args: any[]) => mockUseFunnelReport(...args),
}));

vi.mock("@/components/reports", () => ({
  ReportKpiStrip: ({ data }: any) => (
    <div data-testid="kpi-strip">KPIs: {data.activeMatters} matters</div>
  ),
  ProductivityTable: ({ data }: any) => (
    <div data-testid="productivity-table">{data.feeEarners.length} earners</div>
  ),
  BillingCards: ({ data }: any) => <div data-testid="billing-cards">WIP: {data.wip.total}</div>,
  MatterCharts: ({ data }: any) => <div data-testid="matter-charts">{data.total} matters</div>,
  FunnelChart: ({ data }: any) => <div data-testid="funnel-chart">{data.totalLeads} leads</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("lucide-react", () => ({
  BarChart3: () => <svg data-testid="icon-BarChart3" />,
}));

const defaultQueryResult = { data: null, isLoading: false, isError: false };

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboardReport.mockReturnValue(defaultQueryResult);
    mockUseProductivityReport.mockReturnValue(defaultQueryResult);
    mockUseBillingReport.mockReturnValue(defaultQueryResult);
    mockUseMatterReport.mockReturnValue(defaultQueryResult);
    mockUseFunnelReport.mockReturnValue(defaultQueryResult);
  });

  it("renders page heading", async () => {
    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("shows all tab buttons", async () => {
    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Productivity")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Matters")).toBeInTheDocument();
    expect(screen.getByText("Funnel")).toBeInTheDocument();
  });

  it("renders loading skeletons", async () => {
    mockUseDashboardReport.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders KPI strip on dashboard tab", async () => {
    mockUseDashboardReport.mockReturnValue({
      data: {
        activeMatters: 42,
        totalRevenue: "125000.00",
        totalWip: "35000.00",
        pendingTasks: 18,
        overdueTasks: 3,
        outstandingInvoices: 12,
        overdueDebt: "15000.00",
      },
      isLoading: false,
      isError: false,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getByTestId("kpi-strip")).toBeInTheDocument();
    expect(screen.getByText("KPIs: 42 matters")).toBeInTheDocument();
  });

  it("switches to productivity tab", async () => {
    mockUseProductivityReport.mockReturnValue({
      data: {
        feeEarners: [{ feeEarnerId: "u1", feeEarnerName: "Jane" }],
        summary: {
          totalHours: 100,
          totalBillableHours: 80,
          avgUtilisation: 0.8,
          totalRevenue: "50000",
        },
      },
      isLoading: false,
      isError: false,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    fireEvent.click(screen.getByText("Productivity"));
    expect(screen.getByTestId("productivity-table")).toBeInTheDocument();
  });

  it("switches to billing tab", async () => {
    mockUseBillingReport.mockReturnValue({
      data: {
        wip: { total: "35000", draft: "5000", submitted: "15000", approved: "15000" },
        agedDebt: {
          current: "10000",
          days31to60: "5000",
          days61to90: "3000",
          days90plus: "2000",
          total: "20000",
        },
        revenue: { total: "125000", paid: "100000", outstanding: "25000" },
      },
      isLoading: false,
      isError: false,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    fireEvent.click(screen.getByText("Billing"));
    expect(screen.getByTestId("billing-cards")).toBeInTheDocument();
  });

  it("switches to funnel tab", async () => {
    mockUseFunnelReport.mockReturnValue({
      data: {
        byStatus: [],
        conversionRate: 0.35,
        avgTimeToConvert: 14.5,
        totalLeads: 100,
        wonLeads: 35,
        lostLeads: 20,
      },
      isLoading: false,
      isError: false,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    fireEvent.click(screen.getByText("Funnel"));
    expect(screen.getByTestId("funnel-chart")).toBeInTheDocument();
  });

  it("has data-testid on root element", async () => {
    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getByTestId("reports-page")).toBeInTheDocument();
  });

  it("shows error state", async () => {
    mockUseDashboardReport.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const Page = (await import("@/app/(app)/reports/page")).default;
    render(<Page />);
    expect(screen.getByText("Failed to load report data.")).toBeInTheDocument();
  });
});
