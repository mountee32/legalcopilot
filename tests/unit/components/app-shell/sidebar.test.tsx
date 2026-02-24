import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/app-shell/sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock all lucide-react icons - factory must be self-contained (no external variables)
vi.mock("lucide-react", () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Home: createMockIcon("Home"),
    Inbox: createMockIcon("Inbox"),
    FolderKanban: createMockIcon("FolderKanban"),
    Users: createMockIcon("Users"),
    FileText: createMockIcon("FileText"),
    CheckSquare: createMockIcon("CheckSquare"),
    Calendar: createMockIcon("Calendar"),
    Clock: createMockIcon("Clock"),
    BarChart3: createMockIcon("BarChart3"),
    Filter: createMockIcon("Filter"),
    UsersRound: createMockIcon("UsersRound"),
    Settings: createMockIcon("Settings"),
    HelpCircle: createMockIcon("HelpCircle"),
    Scale: createMockIcon("Scale"),
    Shield: createMockIcon("Shield"),
    GitBranch: createMockIcon("GitBranch"),
    Activity: createMockIcon("Activity"),
    ChevronUp: createMockIcon("ChevronUp"),
    User: createMockIcon("User"),
    LogOut: createMockIcon("LogOut"),
  };
});

// Mock shadcn/ui components that use radix-ui internally
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

// Mock UserMenu since it uses complex radix-ui components
vi.mock("@/components/app-shell/user-menu", () => ({
  UserMenu: () => <button data-testid="user-menu-trigger">User Menu</button>,
}));

// Mock Better Auth client
vi.mock("@/lib/auth/client", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        image: null,
      },
    },
    isPending: false,
  })),
  signOut: vi.fn(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sidebar", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders the logo and brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Legal Copilot")).toBeInTheDocument();
  });

  it("renders all main navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("nav-item-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-ai-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-cases")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-clients")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-documents")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-tasks")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-calendar")).toBeInTheDocument();
  });

  it("renders secondary navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("nav-item-time-&-billing")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-reports")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-compliance")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-workflows")).toBeInTheDocument();
  });

  it("renders tertiary navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByTestId("nav-item-leads")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-team")).toBeInTheDocument();
    expect(screen.getByTestId("nav-item-settings")).toBeInTheDocument();
  });

  it("renders help link in footer", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("nav-item-help")).toBeInTheDocument();
  });

  it("renders user menu", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("user-menu-trigger")).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    render(<Sidebar />);
    const dashboardItem = screen.getByTestId("nav-item-dashboard");
    expect(dashboardItem).toHaveAttribute("data-active", "true");
  });
});
