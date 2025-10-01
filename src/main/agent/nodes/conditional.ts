import { GraphState } from "../GraphState";

/**
 * After Reasoning: Decide if we execute actions or end
 */
export function afterReasoning(state: typeof GraphState.State): string {
  console.log("[AfterReasoning] Determining next step...");

  if (!state.action_plan || !state.action_plan.actions?.length) {
    console.log("[AfterReasoning] No actions planned - workflow complete");
    return "end";
  }

  const currentStepIndex = state.action_plan.current_step ?? 0;
  const currentStep = state.action_plan.actions[currentStepIndex];

  if (!currentStep) {
    console.log("[AfterReasoning] No current step found - ending");
    return "end";
  }

  console.log("[AfterReasoning] Proceeding to execute action");
  return "action";
}

/**
 * After Action: Continue executing actions sequentially or verify when done
 */
export function afterAction(state: typeof GraphState.State): string {
  console.log("[AfterAction] Evaluating action results...");

  const lastResult = state.action_results?.[state.action_results.length - 1];

  if (!lastResult) {
    console.log("[AfterAction] No action result found - internal error");
    return "error_recovery";
  }

  // If action execution itself failed (internal error)
  if (!lastResult.success) {
    console.log(
      "[AfterAction] Action execution failed - going to error recovery"
    );
    return "error_recovery";
  }

  console.log("[AfterAction] Action executed successfully");

  // Check if there are more actions in the current plan
  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const totalActions = state.action_plan?.actions.length ?? 0;

  if (currentStepIndex < totalActions) {
    console.log(
      `[AfterAction] Continuing to next action (${currentStepIndex + 1}/${totalActions})`
    );
    return "action";
  }

  // All actions in the plan are completed - time for batch verification
  console.log("[AfterAction] All actions completed - going to verification");
  return "verification";
}

/**
 * After Verification: Check if iteration was successful and decide next step
 */
export function afterVerification(state: typeof GraphState.State): string {
  console.log("[AfterVerification] Analyzing verification results...");

  if (!state.perception_result) {
    console.log("[AfterVerification] Missing perception result - error");
    return "error_recovery";
  }

  // Check if the action plan had success criteria
  const batchVerification = state.action_plan?.batch_verification;

  if (
    !batchVerification?.success_criteria ||
    batchVerification.success_criteria.length === 0
  ) {
    console.log(
      "[AfterVerification] No success criteria defined - assuming success"
    );
    return handleVerificationSuccess(state);
  }

  // Verify all criteria
  const verificationPassed = checkAllCriteria(
    batchVerification.success_criteria,
    state.perception_result.elements
  );

  if (verificationPassed) {
    console.log("[AfterVerification] Batch verification PASSED");
    return handleVerificationSuccess(state);
  } else {
    console.log("[AfterVerification] Batch verification FAILED");
    return handleVerificationFailure(state);
  }
}

/**
 * Handle successful verification - check if we're done or continue
 */
function handleVerificationSuccess(state: typeof GraphState.State): string {
  // Check if the action plan indicates completion
  const planStatus = state.action_plan?.status;
  const nextAction = state.action_plan?.next_action;

  if (planStatus === "completed" || nextAction === "complete") {
    console.log("[AfterVerification] Task fully completed - ending workflow");
    return "end";
  }

  // Check iteration limits
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterVerification] Max iterations reached - ending");
    return "end";
  }

  // Continue to next iteration - take new screenshot and reason about next actions
  console.log("[AfterVerification] Starting new iteration");
  return "perception";
}

/**
 * Handle failed verification - retry logic
 */
function handleVerificationFailure(state: typeof GraphState.State): string {
  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (retryCount >= maxRetries) {
    console.log("[AfterVerification] Max retries exceeded - ending");
    return "end";
  }

  console.log(
    `[AfterVerification] Retrying iteration (attempt ${retryCount + 1}/${maxRetries})`
  );
  return "perception";
}

/**
 * Check all verification criteria
 */
function checkAllCriteria(
  criteria: Array<{ type: string; content: string }>,
  elements: any[]
): boolean {
  console.log(`[Verification] Checking ${criteria.length} criteria`);

  for (const criterion of criteria) {
    const passed = checkSingleCriterion(criterion, elements);

    if (!passed) {
      console.log(
        `[Verification] FAILED: ${criterion.type} - "${criterion.content}"`
      );
      return false;
    }

    console.log(
      `[Verification] PASSED: ${criterion.type} - "${criterion.content}"`
    );
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

    case "url_contains":
      // Would need to pass URL from perception if available
      console.warn(`[Verification] url_contains not implemented yet`);
      return true;

    default:
      console.warn(`[Verification] Unknown criterion type: ${criterion.type}`);
      return true; // Assume pass for unknown types
  }
}

/**
 * After Error Recovery: Handle internal errors
 */
export function afterErrorRecovery(state: typeof GraphState.State): string {
  console.log("[AfterErrorRecovery] Processing error recovery...");

  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (state.status === "failed" || retryCount >= maxRetries) {
    console.log("[AfterErrorRecovery] Cannot recover - ending test");
    return "end";
  }

  console.log("[AfterErrorRecovery] Retrying from perception");
  return "perception";
}
