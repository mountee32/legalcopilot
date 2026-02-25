import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  Brain: () => <svg data-testid="icon-Brain" />,
  Plug: () => <svg data-testid="icon-Plug" />,
  GitBranch: () => <svg data-testid="icon-GitBranch" />,
  Bell: () => <svg data-testid="icon-Bell" />,
  CalendarClock: () => <svg data-testid="icon-CalendarClock" />,
  ChevronRight: () => <svg data-testid="icon-ChevronRight" />,
  Settings: () => <svg data-testid="icon-Settings" />,
}));

describe("SettingsPage", () => {
  it("renders page heading", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;
    render(<Page />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders all 5 settings links", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;
    render(<Page />);
    expect(screen.getByText("AI Taxonomy Packs")).toBeInTheDocument();
    expect(screen.getByText("Integrations")).toBeInTheDocument();
    expect(screen.getByText("Workflows")).toBeInTheDocument();
    expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
    expect(screen.getByText("Booking & Availability")).toBeInTheDocument();
  });

  it("links to correct sub-pages", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;
    render(<Page />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/settings/taxonomy");
    expect(hrefs).toContain("/settings/integrations");
    expect(hrefs).toContain("/settings/workflows");
    expect(hrefs).toContain("/settings/notifications");
    expect(hrefs).toContain("/settings/booking");
  });

  it("has data-testid on root element", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;
    render(<Page />);
    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
  });

  it("displays descriptions for each card", async () => {
    const Page = (await import("@/app/(app)/settings/page")).default;
    render(<Page />);
    expect(screen.getByText(/Configure extraction categories/)).toBeInTheDocument();
    expect(screen.getByText(/Connect email, calendar/)).toBeInTheDocument();
  });
});
