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
  HelpCircle: () => <svg data-testid="icon-HelpCircle" />,
  LayoutDashboard: () => <svg data-testid="icon-LayoutDashboard" />,
  Briefcase: () => <svg data-testid="icon-Briefcase" />,
  Mail: () => <svg data-testid="icon-Mail" />,
  FileText: () => <svg data-testid="icon-FileText" />,
  CheckSquare: () => <svg data-testid="icon-CheckSquare" />,
  Calendar: () => <svg data-testid="icon-Calendar" />,
  Keyboard: () => <svg data-testid="icon-Keyboard" />,
  MessageCircle: () => <svg data-testid="icon-MessageCircle" />,
}));

describe("HelpPage", () => {
  it("renders page heading", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
  });

  it("renders quick start links", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Cases")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("renders 6 quick start links with correct hrefs", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href")).filter(Boolean);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/matters");
    expect(hrefs).toContain("/inbox");
    expect(hrefs).toContain("/tasks");
    expect(hrefs).toContain("/calendar");
  });

  it("renders keyboard shortcuts section", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Open command palette")).toBeInTheDocument();
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument();
  });

  it("renders FAQ section with questions", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    expect(screen.getByText("How does the AI pipeline process documents?")).toBeInTheDocument();
    expect(screen.getByText("Can I override AI-generated findings?")).toBeInTheDocument();
  });

  it("renders contact section with email", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByText("Contact Support")).toBeInTheDocument();
    const emailLink = screen.getByText("support@legalcopilot.com");
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest("a")).toHaveAttribute("href", "mailto:support@legalcopilot.com");
  });

  it("has data-testid on root element", async () => {
    const Page = (await import("@/app/(app)/help/page")).default;
    render(<Page />);
    expect(screen.getByTestId("help-page")).toBeInTheDocument();
  });
});
