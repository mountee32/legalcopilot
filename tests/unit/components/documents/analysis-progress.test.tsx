/**
 * Unit tests for AnalysisProgress component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisProgress } from "@/components/documents/analysis-progress";

describe("AnalysisProgress", () => {
  it("shows uploading state", () => {
    render(<AnalysisProgress status="uploading" />);
    expect(screen.getByText("Uploading document...")).toBeInTheDocument();
    expect(screen.getByText(/Please wait/i)).toBeInTheDocument();
  });

  it("shows analyzing state", () => {
    render(<AnalysisProgress status="analyzing" />);
    expect(screen.getByText("Analyzing document...")).toBeInTheDocument();
    expect(screen.getByText(/AI is extracting/i)).toBeInTheDocument();
  });

  it("shows complete state", () => {
    render(<AnalysisProgress status="complete" />);
    expect(screen.getByText("Analysis complete")).toBeInTheDocument();
    expect(screen.getByText(/Review the extracted/i)).toBeInTheDocument();
  });

  it("shows error state with message", () => {
    render(<AnalysisProgress status="error" error="Network connection failed" />);
    expect(screen.getByText("Analysis failed")).toBeInTheDocument();
    expect(screen.getByText("Network connection failed")).toBeInTheDocument();
  });

  it("shows retry button on error", () => {
    const onRetry = vi.fn();
    render(<AnalysisProgress status="error" error="Failed" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show retry button when onRetry not provided", () => {
    render(<AnalysisProgress status="error" error="Failed" />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("shows progress indicator during uploading", () => {
    const { container } = render(<AnalysisProgress status="uploading" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows progress indicator during analyzing", () => {
    const { container } = render(<AnalysisProgress status="analyzing" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("does not show progress indicator when complete", () => {
    const { container } = render(<AnalysisProgress status="complete" />);
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });
});
