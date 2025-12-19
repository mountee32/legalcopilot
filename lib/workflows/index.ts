/**
 * Workflow Engine
 *
 * Core workflow management functionality for evidence-backed compliance workflows.
 *
 * Key capabilities:
 * - Workflow activation with applicability condition evaluation
 * - Stage completion predicates (all_mandatory_tasks, all_tasks)
 * - Gate checking (hard, soft, none)
 * - Automatic stage progression
 * - Relative due date calculation
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

// Workflow activation
export {
  activateWorkflow,
  evaluateApplicabilityConditions,
  type ActivateWorkflowParams,
  type ActivateWorkflowResult,
} from "./activate";

// Stage completion
export {
  checkStageCompletion,
  getWorkflowCompletionStatus,
  calculateWorkflowProgress,
  type CompletionCriteria,
  type StageCompletionStatus,
} from "./completion";

// Gate checking
export {
  checkGate,
  overrideGate,
  getStageGateType,
  type GateType,
  type GateCheckResult,
  type GateOverrideParams,
} from "./gating";

// Stage progression
export {
  handleTaskStatusChange,
  startStage,
  completeStage,
  advanceToNextStage,
  type StageProgressionResult,
} from "./stage-progression";

// Due date calculation
export {
  calculateDueDate,
  calculateBusinessDays,
  isDueOverdue,
  getDaysUntilDue,
  type DueDateRelativeTo,
  type CalculateDueDateParams,
} from "./due-dates";
