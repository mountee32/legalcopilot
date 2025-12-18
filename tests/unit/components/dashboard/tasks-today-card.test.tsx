import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TasksTodayCard, type TaskItem } from "@/components/dashboard/tasks-today-card";

// Mock lucide-react icons - pass through data-testid props
vi.mock("lucide-react", () => {
  const createMockIcon = (name: string) => {
    const MockIcon = (props: { className?: string; "data-testid"?: string }) => (
      <svg data-testid={props["data-testid"] || `icon-${name}`} className={props.className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    CheckSquare: createMockIcon("CheckSquare"),
    Square: createMockIcon("Square"),
    AlertCircle: createMockIcon("AlertCircle"),
  };
});

const mockTasks: TaskItem[] = [
  {
    id: "1",
    title: "Review contract",
    priority: "high",
    dueDate: "2024-12-18",
    matterId: "CONV-2024-042",
    isOverdue: false,
    isCompleted: false,
  },
  {
    id: "2",
    title: "Submit IHT form",
    priority: "urgent",
    dueDate: "2024-12-15",
    matterId: "PROB-2024-018",
    isOverdue: true,
    isCompleted: false,
  },
  {
    id: "3",
    title: "Send completion statement",
    priority: "medium",
    dueDate: "2024-12-18",
    matterId: "CONV-2024-035",
    isOverdue: false,
    isCompleted: true,
  },
];

describe("TasksTodayCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(<TasksTodayCard tasks={[]} total={0} />);

    expect(screen.getByTestId("tasks-today-card")).toBeInTheDocument();
    expect(screen.getByText("My Tasks Today")).toBeInTheDocument();
  });

  it("shows empty state when no tasks", () => {
    render(<TasksTodayCard tasks={[]} total={0} />);

    expect(screen.getByTestId("tasks-today-empty")).toBeInTheDocument();
    expect(screen.getByText(/All caught up/)).toBeInTheDocument();
  });

  it("renders list of tasks", () => {
    render(<TasksTodayCard tasks={mockTasks} total={8} />);

    expect(screen.getByTestId("tasks-today-list")).toBeInTheDocument();
    expect(screen.getByText("Review contract")).toBeInTheDocument();
    expect(screen.getByText("Submit IHT form")).toBeInTheDocument();
    expect(screen.getByText("Send completion statement")).toBeInTheDocument();
  });

  it("shows total count badge", () => {
    render(<TasksTodayCard tasks={mockTasks} total={8} />);

    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("displays priority badges", () => {
    render(<TasksTodayCard tasks={mockTasks} total={3} />);

    expect(screen.getByTestId("task-priority-1")).toHaveTextContent("high");
    expect(screen.getByTestId("task-priority-2")).toHaveTextContent("urgent");
    expect(screen.getByTestId("task-priority-3")).toHaveTextContent("medium");
  });

  it("shows overdue indicator for overdue tasks", () => {
    render(<TasksTodayCard tasks={mockTasks} total={3} />);

    expect(screen.getByTestId("task-overdue-2")).toBeInTheDocument();
    expect(screen.queryByTestId("task-overdue-1")).not.toBeInTheDocument();
  });

  it("calls onComplete when checkbox clicked", () => {
    const onComplete = vi.fn();
    render(<TasksTodayCard tasks={mockTasks} total={3} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("task-checkbox-1"));
    expect(onComplete).toHaveBeenCalledWith("1");
  });

  it("shows View All Tasks link", () => {
    render(<TasksTodayCard tasks={mockTasks} total={3} />);

    const viewAllLink = screen.getByTestId("view-all-tasks-link");
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute("href", "/tasks");
  });

  it("shows loading skeleton when isLoading", () => {
    render(<TasksTodayCard tasks={[]} total={0} isLoading />);

    expect(screen.getByTestId("tasks-today-card-loading")).toBeInTheDocument();
  });

  it("shows matter ID for each task", () => {
    render(<TasksTodayCard tasks={mockTasks} total={3} />);

    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
    expect(screen.getByText("PROB-2024-018")).toBeInTheDocument();
    expect(screen.getByText("CONV-2024-035")).toBeInTheDocument();
  });

  it("applies line-through style to completed tasks", () => {
    render(<TasksTodayCard tasks={mockTasks} total={3} />);

    const completedTask = screen.getByText("Send completion statement");
    expect(completedTask).toHaveClass("line-through");
  });
});
