import { GraphState } from "../GraphState";

/**
 * Error Recovery Node - Handles INTERNAL errors (code failures, API errors, etc.)
 * NOT for scenario verification failures (those are handled in verification flow)
 */
export async function errorRecoveryNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("Handling internal error...");
  console.log(`Error: ${state.last_error}`);
  console.log(`Retry ${state.retry_count || 0}/${state.max_retries || 3}`);

  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (retryCount >= maxRetries) {
    console.log("Max retries exceeded - test failed");
    return {
      status: "failed",
      last_error: `Test failed after ${maxRetries} retry attempts: ${state.last_error}`,
      errors: [
        ...(state.errors || []),
        `Max retries exceeded. Last error: ${state.last_error}`,
      ],
    };
  }

  const recoveryStrategy = determineRecoveryStrategy(state.last_error || "");

  console.log(`Applying recovery strategy: ${recoveryStrategy}`);

  switch (recoveryStrategy) {
    case "retry_perception":
      return {
        status: "running",
        retry_count: retryCount + 1,
        last_error: "",
      };

    case "rollback_action":
      const currentStep = state.action_plan?.current_step ?? 0;
      const rollbackStep = Math.max(0, currentStep - 1);

      return {
        status: "running",
        retry_count: retryCount + 1,
        action_plan: state.action_plan
          ? {
              ...state.action_plan,
              current_step: rollbackStep,
              status: "in_progress" as const,
            }
          : undefined,
        last_error: "",
      };

    case "retry_reasoning":
      // LLM failed to generate valid plan - retry
      return {
        status: "running",
        retry_count: retryCount + 1,
        action_plan: undefined, // Clear invalid plan
        last_error: "",
      };

    case "fail":
    default:
      // Unrecoverable error
      return {
        status: "failed",
        last_error: `Unrecoverable error: ${state.last_error}`,
        errors: [
          ...(state.errors || []),
          `Recovery failed: ${state.last_error}`,
        ],
      };
  }
}

function determineRecoveryStrategy(errorMessage: string): string {
  const errorLower = errorMessage.toLowerCase();

  // Perception-related errors
  if (
    errorLower.includes("screenshot") ||
    errorLower.includes("perception") ||
    errorLower.includes("capture")
  ) {
    return "retry_perception";
  }

  // Action execution errors
  if (
    errorLower.includes("element not found") ||
    errorLower.includes("action failed") ||
    errorLower.includes("timeout")
  ) {
    return "rollback_action";
  }

  // Reasoning/LLM errors
  if (
    errorLower.includes("llm") ||
    errorLower.includes("action plan") ||
    errorLower.includes("no actions")
  ) {
    return "retry_reasoning";
  }

  // Unknown or critical errors
  if (
    errorLower.includes("critical") ||
    errorLower.includes("fatal") ||
    errorLower.includes("cannot recover")
  ) {
    return "fail";
  }

  return "retry_perception";
}
