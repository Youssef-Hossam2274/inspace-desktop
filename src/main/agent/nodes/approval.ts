import { GraphState } from "../GraphState";

export async function approvalNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("\n[APPROVAL] Awaiting user decision...");

  if (!state.action_plan) {
    return {
      status: "failed",
      last_error: "No action plan to approve",
      errors: [...state.errors, "No action plan to approve"],
    };
  }

  // If user already made decision (resuming), just pass through
  if (state.user_decision) {
    console.log(`[APPROVAL] Decision: ${state.user_decision}`);
    return {};
  }

  // First time - wait for approval
  return {
    status: "awaiting_approval",
    pending_approval: true,
  };
}
