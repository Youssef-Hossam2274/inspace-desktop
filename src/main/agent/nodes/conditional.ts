import { GraphState } from "../GraphState";

/**
 * After Perception: Always go to reasoning to analyze current state
 */
export function afterPerception(state: typeof GraphState.State): string {
  console.log("[AfterPerception] Moving to reasoning...");
  return "reasoning";
}

/**
 * After Reasoning: Decide if we execute actions or end
 */
export function afterReasoning(state: typeof GraphState.State): string {
  console.log("[AfterReasoning] Determining next step...");

  if (!state.action_plan || !state.action_plan.actions?.length) {
    console.log("[AfterReasoning] No actions planned - task complete");
    return "end";
  }

  console.log(
    `[AfterReasoning] Plan has ${state.action_plan.actions.length} actions`
  );
  return "action";
}

/**
 * After Action: Continue executing actions OR verify when batch is done
 */
export function afterAction(state: typeof GraphState.State): string {
  console.log("[AfterAction] Evaluating action completion...");

  const lastResult = state.action_results?.[state.action_results.length - 1];

  if (!lastResult) {
    console.log("[AfterAction] No action result - error");
    return "error_recovery";
  }

  if (!lastResult.success) {
    console.log("[AfterAction] Action failed - going to error recovery");
    return "error_recovery";
  }

  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const totalActions = state.action_plan?.actions.length ?? 0;

  // Check if there are more actions in current plan
  if (currentStepIndex < totalActions) {
    console.log(
      `[AfterAction] Continuing to action ${currentStepIndex + 1}/${totalActions}`
    );
    return "action";
  }

  // All actions completed - go to verification
  console.log(
    "[AfterAction] All actions in plan completed - verifying iteration"
  );
  return "verification";
}

/**
 * After Verification: Most important - decide if iteration succeeded and what's next
 */
export function afterVerification(state: typeof GraphState.State): string {
  console.log("[AfterVerification] Analyzing iteration results...");

  // Check iteration limit first
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterVerification] Max iterations reached - ending");
    return "end";
  }

  // Check if LLM marked task as complete
  if (
    state.action_plan?.status === "completed" ||
    state.action_plan?.next_action === "complete"
  ) {
    console.log("[AfterVerification] Task marked as complete by LLM - ending");
    return "end";
  }

  // Check verification criteria
  const batchVerification = state.action_plan?.batch_verification;

  if (
    !batchVerification?.success_criteria ||
    batchVerification.success_criteria.length === 0
  ) {
    console.log(
      "[AfterVerification] No verification criteria - continuing to next iteration"
    );
    return "perception";
  }

  // Verify the criteria
  const verificationPassed = checkAllCriteria(
    batchVerification.success_criteria,
    state.perception_result?.elements || []
  );

  if (verificationPassed) {
    console.log(
      "[AfterVerification] Verification PASSED - starting next iteration"
    );
    // Reset retry count on success
    return "perception";
  } else {
    console.log("[AfterVerification] Verification FAILED - retry or continue");

    const retryCount = state.retry_count || 0;
    const maxRetries = state.max_retries || 2;

    if (retryCount >= maxRetries) {
      console.log(
        "[AfterVerification] Max retries for this iteration - moving to next anyway"
      );
      // Continue to next iteration even if verification failed
      return "perception";
    }

    console.log(
      `[AfterVerification] Retrying iteration (${retryCount + 1}/${maxRetries})`
    );
    return "perception";
  }
}

/**
 * Check all verification criteria
 */
function checkAllCriteria(
  criteria: Array<{ type: string; content: string }>,
  elements: any[]
): boolean {
  console.log(
    `[Verification] Checking ${criteria.length} criteria against ${elements.length} elements`
  );

  for (const criterion of criteria) {
    const passed = checkSingleCriterion(criterion, elements);

    if (!passed) {
      console.log(
        `[Verification] ✗ FAILED: ${criterion.type} - "${criterion.content}"`
      );
      return false;
    }

    console.log(
      `[Verification] ✓ PASSED: ${criterion.type} - "${criterion.content}"`
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
          el.type?.toLowerCase().includes(criterion.content.toLowerCase()) ||
          el.content?.toLowerCase().includes(criterion.content.toLowerCase())
      );

    case "element_not_visible":
      return !elements.some(
        (el) =>
          el.type?.toLowerCase().includes(criterion.content.toLowerCase()) ||
          el.content?.toLowerCase().includes(criterion.content.toLowerCase())
      );

    default:
      console.warn(`[Verification] Unknown criterion type: ${criterion.type}`);
      return true;
  }
}

/**
 * After Error Recovery: Retry or fail
 */
export function afterErrorRecovery(state: typeof GraphState.State): string {
  console.log("[AfterErrorRecovery] Handling recovery...");

  const retryCount = state.retry_count || 0;
  const maxRetries = state.max_retries || 3;

  if (state.status === "failed" || retryCount >= maxRetries) {
    console.log("[AfterErrorRecovery] Cannot recover - ending");
    return "end";
  }

  console.log("[AfterErrorRecovery] Retrying from perception");
  return "perception";
}
