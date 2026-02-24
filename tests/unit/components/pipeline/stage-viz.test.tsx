import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StageViz } from "@/components/pipeline/stage-viz";

describe("StageViz", () => {
  it("renders all 6 stages", () => {
    const { container } = render(
      <StageViz currentStage={null} stageStatuses={{}} runStatus="queued" />
    );

    expect(screen.getByText("Intake")).toBeDefined();
    expect(screen.getByText("OCR")).toBeDefined();
    expect(screen.getByText("Classify")).toBeDefined();
    expect(screen.getByText("Extract")).toBeDefined();
    expect(screen.getByText("Reconcile")).toBeDefined();
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("shows running status for current stage", () => {
    render(
      <StageViz
        currentStage="classify"
        stageStatuses={{
          intake: {
            status: "completed",
            startedAt: "2025-01-01T00:00:00Z",
            completedAt: "2025-01-01T00:00:02Z",
          },
          ocr: {
            status: "completed",
            startedAt: "2025-01-01T00:00:02Z",
            completedAt: "2025-01-01T00:00:05Z",
          },
          classify: { status: "running", startedAt: "2025-01-01T00:00:05Z" },
        }}
        runStatus="running"
      />
    );

    expect(screen.getByText("Processing...")).toBeDefined();
  });

  it("shows Failed text for failed stage", () => {
    render(
      <StageViz
        currentStage="extract"
        stageStatuses={{
          intake: { status: "completed" },
          ocr: { status: "completed" },
          classify: { status: "completed" },
          extract: { status: "failed", error: "Timeout" },
        }}
        runStatus="failed"
      />
    );

    expect(screen.getByText("Failed")).toBeDefined();
  });
});
