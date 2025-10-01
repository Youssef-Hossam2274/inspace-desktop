import { GraphState } from "../GraphState";

export function afterReasoning(state: typeof GraphState.State): string {
  console.log("Determining next step...");

  if (!state.action_plan || !state.action_plan.actions?.length) {
    console.log("No actions planned, ending");
    return "end";
  }

  const currentStepIndex = state.action_plan.current_step ?? 0;
  const currentStep = state.action_plan.actions[currentStepIndex];

  if (!currentStep) {
    console.log("No current step found");
    return "end";
  }

  // If the previous step needed verification and we just did perception,
  // we need to check if verification passed before continuing
  if (state.verification_needed && state.iteration_count > 0) {
    console.log("Need to verify previous action results");
    return "verification";
  }

  console.log("Proceeding to execute action");
  return "action";
}

/**
 * After Action: Decide next step based on action execution results
 */
export function afterAction(state: typeof GraphState.State): string {
  console.log("Evaluating action results...");

  const lastResult = state.action_results?.[state.action_results.length - 1];

  if (!lastResult) {
    console.log("No action result found - internal error");
    return "error_recovery";
  }

  // If action execution itself failed (internal error, not verification)
  if (!lastResult.success) {
    console.log("Action execution failed - internal error");
    return "error_recovery";
  }

  console.log("Action executed successfully");

  // Check if this action requires verification
  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const executedStep = state.action_plan?.actions[currentStepIndex - 1];

  const needsVerification =
    executedStep?.verify_immediately ||
    state.action_plan?.batch_verification?.after_step === executedStep?.step_id;

  if (needsVerification) {
    console.log("Action needs verification - going to verification");
    return "verification";
  }

  // No verification needed, check if we're done or continue
  const planStatus = state.action_plan?.status;
  const nextAction = state.action_plan?.next_action;

  if (planStatus === "completed" || nextAction === "complete") {
    console.log("[AfterAction] All actions completed successfully");
    return "end";
  }

  // Check iteration limits
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterAction] Max iterations reached");
    return "end";
  }

  console.log("[AfterAction] Continuing to next action");
  return "action";
}

export function afterVerification(state: typeof GraphState.State): string {
  console.log("Analyzing verification results...");

  if (!state.perception_result || !state.action_plan) {
    console.log("Missing perception or action plan");
    return "error_recovery";
  }

  const lastExecutedStepIndex = (state.action_plan.current_step ?? 1) - 1;
  const lastExecutedStep = state.action_plan.actions[lastExecutedStepIndex];

  if (!lastExecutedStep?.expected_outcome) {
    console.log("No expected outcome defined, assuming success");
    return afterVerificationSuccess(state);
  }

  // Verify the expected outcome against current UI state
  const verificationPassed = checkVerificationCriteria(
    lastExecutedStep.expected_outcome,
    state.perception_result.elements,
    state.action_plan.batch_verification
  );

  if (verificationPassed) {
    console.log("Verification passed!");
    return afterVerificationSuccess(state);
  } else {
    console.log("Verification failed!");
    return afterVerificationFailure(state);
  }
}

/**
 * Handle successful verification
 */
function afterVerificationSuccess(state: typeof GraphState.State): string {
  const planStatus = state.action_plan?.status;

  // If all actions are complete
  if (
    planStatus === "completed" ||
    (state.action_plan?.current_step ?? 0) >=
      (state.action_plan?.actions.length ?? 0)
  ) {
    console.log("Test scenario completed successfully");
    return "end";
  }

  // Check iteration limits
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("Max iterations reached");
    return "end";
  }

  // Continue with next action - take new screenshot if needed
  const nextStepIndex = state.action_plan?.current_step ?? 0;
  const nextStep = state.action_plan?.actions[nextStepIndex];

  if (nextStep && state.action_plan?.next_action === "continue") {
    console.log("Taking new screenshot for next action");
    return "perception";
  }

  console.log("Continuing to next action");
  return "action";
}

/**
 * Handle failed verification
 */
function afterVerificationFailure(state: typeof GraphState.State): string {
  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (retryCount >= maxRetries) {
    console.log("Max verification retries exceeded");
    return "end";
  }

  console.log(`Retrying action (attempt ${retryCount + 1}/${maxRetries})`);
  return "perception";
}

/**
 * Check if verification criteria are met
 */
function checkVerificationCriteria(
  expectedOutcome: {
    verification_type: string;
    expected_content: string[];
  },
  currentElements: any[],
  batchVerification?: {
    after_step: number;
    success_criteria: Array<{
      type: string;
      content: string;
    }>;
  }
): boolean {
  console.log(
    `[Verification] Checking criteria: ${expectedOutcome.verification_type}`
  );

  const criteriaToCh: Array<{ type: string; content: string }> = [
    {
      type: expectedOutcome.verification_type,
      content: expectedOutcome.expected_content[0] || "",
    },
  ];

  if (batchVerification?.success_criteria) {
    criteriaToCh.push(...batchVerification.success_criteria);
  }

  for (const criterion of criteriaToCh) {
    const passed = checkSingleCriterion(criterion, currentElements);

    if (!passed) {
      console.log(`Failed criterion: ${criterion.type} - ${criterion.content}`);
      return false;
    }

    console.log(`Passed criterion: ${criterion.type} - ${criterion.content}`);
  }

  return true;
}

/**
 * Check a single verification criterion
 */
function checkSingleCriterion(
  criterion: { type: string; content: string },
  elements: any[]
): boolean {
  switch (criterion.type) {
    case "text_present":
      return elements.some((el) =>
        el.content?.toLowerCase().includes(criterion.content.toLowerCase())
      );

    case "element_visible":
      return elements.some(
        (el) =>
          el.type === criterion.content ||
          el.content?.toLowerCase().includes(criterion.content.toLowerCase())
      );

    case "element_not_visible":
      return !elements.some(
        (el) =>
          el.type === criterion.content ||
          el.content?.toLowerCase().includes(criterion.content.toLowerCase())
      );

    default:
      console.warn(`Unknown criterion type: ${criterion.type}`);
      return true; // Assume pass for unknown types
  }
}

/**
 * After Error Recovery: Internal error handling (not verification failures)
 */
export function afterErrorRecovery(state: typeof GraphState.State): string {
  console.log("Processing internal error recovery...");

  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (state.status === "failed" || retryCount >= maxRetries) {
    console.log("Cannot recover from internal error, ending test");
    return "end";
  }

  console.log("Retrying after internal error");
  return "perception";
}
