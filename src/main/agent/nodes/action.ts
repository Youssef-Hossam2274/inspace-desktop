import { AgentState, ActionResult } from "../types";

export async function actionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("[ActionNode] Executing actions...");

  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const currentStep = state.action_plan?.actions[currentStepIndex];

  if (!currentStep) {
    console.warn("[ActionNode] No current step found in action plan");
    return {
      status: "failed",
      last_error: "No current action step found",
    };
  }

  const result: ActionResult = {
    step_id: currentStep.step_id, // required
    success: true, // simulate execution success for now
    screenshot_after: undefined, // can be filled with a real screenshot later
    verification_result: true, // can be actual verification later
  };

  // advance to the next step in the plan if available
  const nextStep = currentStepIndex + 1;
  const planStatus =
    nextStep >= (state.action_plan?.actions.length ?? 0)
      ? "completed"
      : "in_progress";

  return {
    action_results: [...(state.action_results || []), result],
    action_plan: state.action_plan
      ? {
          ...state.action_plan,
          current_step: nextStep,
          status: planStatus,
          next_action: planStatus === "completed" ? "complete" : "continue",
        }
      : undefined,
  };
}
