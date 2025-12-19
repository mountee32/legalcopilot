/**
 * Unit tests for ConfidenceBadge component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ConfidenceBadge,
  getConfidenceLevel,
  getConfidenceLabel,
} from "@/components/documents/confidence-badge";

describe("getConfidenceLevel", () => {
  it("returns green for 80-100", () => {
    expect(getConfidenceLevel(80)).toBe("green");
    expect(getConfidenceLevel(90)).toBe("green");
    expect(getConfidenceLevel(100)).toBe("green");
  });

  it("returns amber for 50-79", () => {
    expect(getConfidenceLevel(50)).toBe("amber");
    expect(getConfidenceLevel(65)).toBe("amber");
    expect(getConfidenceLevel(79)).toBe("amber");
  });

  it("returns red for 0-49", () => {
    expect(getConfidenceLevel(0)).toBe("red");
    expect(getConfidenceLevel(25)).toBe("red");
    expect(getConfidenceLevel(49)).toBe("red");
  });
});

describe("getConfidenceLabel", () => {
  it("returns correct labels", () => {
    expect(getConfidenceLabel("green")).toBe("High confidence");
    expect(getConfidenceLabel("amber")).toBe("Review recommended");
    expect(getConfidenceLabel("red")).toBe("Manual review required");
  });
});

describe("ConfidenceBadge", () => {
  it("renders percentage by default", () => {
    render(<ConfidenceBadge confidence={85} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("hides percentage when showPercentage is false", () => {
    render(<ConfidenceBadge confidence={85} showPercentage={false} />);
    expect(screen.queryByText("85%")).not.toBeInTheDocument();
  });

  it("uses computed level when level not provided", () => {
    const { container } = render(<ConfidenceBadge confidence={90} />);
    expect(container.querySelector(".bg-green-500")).toBeInTheDocument();
  });

  it("uses provided level over computed", () => {
    const { container } = render(<ConfidenceBadge confidence={90} level="red" />);
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<ConfidenceBadge confidence={85} className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
