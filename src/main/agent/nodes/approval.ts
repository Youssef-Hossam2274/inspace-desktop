import { GraphState } from "../GraphState";

/**
 * Approval Node - Check if we already have a decision, or set pending flag
 * This node will be entered twice:
 * 1. First time: no decision yet, set pending
 * 2. Second time (after resume): decision is set, just pass through
 */
export async function approvalNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("\n[APPROVAL] Node entered");

  if (!state.action_plan) {
    console.error("[APPROVAL] No action plan to approve");
    return {
      status: "failed",
      last_error: "No action plan available for approval",
      errors: [...state.errors, "No action plan available for approval"],
    };
  }

  // Check if we already have a user decision (resuming after interrupt)
  if (state.user_decision) {
    console.log(`[APPROVAL] User decision already set: ${state.user_decision}`);
    console.log("[APPROVAL] Passing through to routing...");
    return {
      // Keep the decision, don't change state
    };
  }

  // First time through - need approval
  console.log(
    `[APPROVAL] Awaiting user approval for ${state.action_plan.actions.length} actions`
  );

  return {
    status: "awaiting_approval",
    pending_approval: true,
  };
}

/**
 * After Approval routing - called when resuming after user decision
 */
export function afterApproval(state: typeof GraphState.State): string {
  console.log("[AfterApproval] Routing based on user decision...");

  if (!state.user_decision) {
    console.error("[AfterApproval] No user decision available!");
    return "action"; // Default fallback
  }

  if (state.user_decision === "retry") {
    console.log("[AfterApproval] User requested retry - back to perception");
    return "perception";
  }

  if (state.user_decision === "approve") {
    console.log("[AfterApproval] User approved - executing actions");
    return "action";
  }

  console.warn("[AfterApproval] Unknown decision, defaulting to action");
  return "action";
}
