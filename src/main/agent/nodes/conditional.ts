import { GraphState } from "../GraphState";

export function afterReasoning(state: typeof GraphState.State): string {
  if (state.user_decision === "abort") {
    return "end";
  }

  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    return "end";
  }

  if (
    !state.action_plan?.actions?.length ||
    state.action_plan.next_action === "complete"
  ) {
    return "end";
  }

  return "approval";
}

export function afterApproval(state: typeof GraphState.State): string {
  if (state.user_decision === "retry") {
    return "perception";
  }
  if (state.user_decision === "abort") {
    return "end";
  }
  return "action";
}

export function afterAction(state: typeof GraphState.State): string {
  const lastResult = state.action_results?.[state.action_results.length - 1];
  if (state.user_decision === "abort") {
    return "end";
  }

  if (!lastResult?.success) {
    return "perception";
  }

  const currentStep = state.action_plan?.current_step ?? 0;
  const totalActions = state.action_plan?.actions.length ?? 0;
  if (currentStep < totalActions) {
    return "action";
  }
  return "verification";
}

export function afterVerification(state: typeof GraphState.State): string {
  console.log("[AfterVerification] Analyzing results...");

  if ((state.iteration_count || 0) >= (state.max_iterations || 10)) {
    console.log("[AfterVerification] Max iterations reached");
    return "end";
  }
  if (state.user_decision === "abort") {
    return "end";
  }
  const batchVerification = state.action_plan?.batch_verification;

  // Check verification results
  const verificationPassed = checkVerificationCriteria(
    batchVerification?.success_criteria || [],
    state.perception_result?.elements || []
  );

  console.log(
    `[AfterVerification] Verification: ${verificationPassed ? "PASSED" : "FAILED"}`
  );
  console.log(
    `[AfterVerification] Next action: ${state.action_plan?.next_action}`
  );

  if (verificationPassed) {
    // Verification passed - check if LLM says task is complete
    if (state.action_plan?.next_action === "complete") {
      console.log("[AfterVerification] Task marked complete by LLM - ending");
      return "end";
    }

    // Check if this is a simple "open X" task that's already complete
    const userPrompt = state.user_prompt.toLowerCase().trim();
    const isSimpleOpenTask = /^open\s+\w+$/i.test(userPrompt); // "open discord", "open chrome", etc.

    if (isSimpleOpenTask && verificationPassed) {
      console.log("[AfterVerification] Simple open task complete - ending");
      return "end";
    }

    console.log(
      "[AfterVerification] Verification passed, continuing to next iteration"
    );
    return "perception";
  } else {
    // Verification failed - retry
    console.log("[AfterVerification] Verification failed, retrying perception");
    return "perception";
  }
}

export function checkVerificationCriteria(
  criteria: Array<{ type: string; content: string }>,
  elements: any[]
): boolean {
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

export function checkSingleCriterion(
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
