import { GraphState } from "../GraphState";

export function afterPerception(state: typeof GraphState.State): string {
  console.log("[AfterPerception] Moving to reasoning...");
  return "reasoning";
}

export function afterReasoning(state: typeof GraphState.State): string {
  console.log("[AfterReasoning] Determining next step...");

  // Check iteration limit
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterReasoning] Max iterations reached - ending");
    return "end";
  }

  // Check if task is complete
  if (!state.action_plan || !state.action_plan.actions?.length) {
    console.log("[AfterReasoning] No actions planned - task complete");
    return "end";
  }

  if (state.action_plan.next_action === "complete") {
    console.log("[AfterReasoning] LLM marked task as complete - ending");
    return "end";
  }

  console.log(
    `[AfterReasoning] Plan has ${state.action_plan.actions.length} actions - going to approval`
  );
  return "approval";
}

/**
 * After approval check - determines if we have user decision or need to wait
 * This is called AFTER the approval node executes
 */
export function afterApprovalCheck(state: typeof GraphState.State): string {
  console.log("[AfterApprovalCheck] Checking approval status...");

  // If no user decision yet, end and wait for input
  if (!state.user_decision || state.pending_approval) {
    console.log(
      "[AfterApprovalCheck] No decision yet - ending to wait for user"
    );
    return "wait";
  }

  if (state.user_decision === "retry") {
    console.log(
      "[AfterApprovalCheck] User requested retry - back to perception"
    );
    return "perception";
  }

  if (state.user_decision === "approve") {
    console.log("[AfterApprovalCheck] User approved - executing actions");
    return "action";
  }

  console.warn("[AfterApprovalCheck] Unknown decision, defaulting to action");
  return "action";
}

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

  if (currentStepIndex < totalActions) {
    console.log(
      `[AfterAction] Continuing to action ${currentStepIndex + 1}/${totalActions}`
    );
    return "action";
  }

  console.log(
    "[AfterAction] All actions in plan completed - verifying iteration"
  );
  return "verification";
}

export function afterVerification(state: typeof GraphState.State): string {
  console.log("[AfterVerification] Analyzing iteration results...");

  // Check iteration limit FIRST
  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterVerification] Max iterations reached - ending");
    return "end";
  }

  // Check if task is marked complete
  if (
    state.action_plan?.status === "completed" ||
    state.action_plan?.next_action === "complete"
  ) {
    console.log("[AfterVerification] Task marked as complete - ending");
    return "end";
  }

  const batchVerification = state.action_plan?.batch_verification;

  // If no verification criteria, check if LLM thinks we should continue
  if (
    !batchVerification?.success_criteria ||
    batchVerification.success_criteria.length === 0
  ) {
    // No verification - check action plan's next_action
    if (state.action_plan?.next_action === "complete") {
      console.log("[AfterVerification] Action plan says complete - ending");
      return "end";
    }

    console.log(
      "[AfterVerification] No verification criteria - continuing to next iteration"
    );
    return "perception";
  }

  // Verify criteria
  const verificationPassed = checkAllCriteria(
    batchVerification.success_criteria,
    state.perception_result?.elements || []
  );

  if (verificationPassed) {
    console.log("[AfterVerification] Verification PASSED");

    // SUCCESS! But should we continue or end?
    if (state.action_plan?.next_action === "complete") {
      console.log("[AfterVerification] Task complete - ending");
      return "end";
    }

    // Check if we're just opening Discord (initial step)
    const userPrompt = state.user_prompt.toLowerCase();

    // If prompt is just "open discord" and discord is open, we're done
    if (userPrompt.includes("open discord") && !userPrompt.includes("and")) {
      console.log(
        "[AfterVerification] Simple 'open discord' task complete - ending"
      );
      return "end";
    }

    console.log(
      "[AfterVerification] Verification passed, starting next iteration"
    );
    return "perception";
  } else {
    console.log("[AfterVerification] Verification FAILED");

    const retryCount = state.retry_count || 0;
    const maxRetries = state.max_retries || 2;

    if (retryCount >= maxRetries) {
      console.log(
        "[AfterVerification] Max retries reached - moving forward anyway"
      );
      return "perception";
    }

    console.log(
      `[AfterVerification] Retrying iteration (${retryCount + 1}/${maxRetries})`
    );
    return "perception";
  }
}

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
