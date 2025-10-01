import { GraphState } from "../GraphState";

/**
 * Verification Node - Determines if we need to verify the current action's outcome
 * If verification is needed, it triggers a new perception cycle to check results
 */

export async function verificationNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("Checking if verification is needed...");

  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const lastExecutedStep = state.action_plan?.actions[currentStepIndex - 1];

  if (!lastExecutedStep) {
    console.log("No executed step to verify");
    return {
      verification_needed: false,
    };
  }

  // Check if this step requires verification
  const needsImmediateVerification = lastExecutedStep.verify_immediately;
  const needsBatchVerification =
    state.action_plan?.batch_verification?.after_step ===
    lastExecutedStep.step_id;

  if (!needsImmediateVerification && !needsBatchVerification) {
    console.log("No verification required for this step");
    return {
      verification_needed: false,
    };
  }

  console.log(`Verification required for step ${lastExecutedStep.step_id}`);
  console.log(
    `Expected outcome: ${JSON.stringify(lastExecutedStep.expected_outcome)}`
  );

  // Mark that we need verification and increment iteration for new perception cycle
  return {
    verification_needed: true,
    iteration_count: (state.iteration_count || 0) + 1,
  };
}
