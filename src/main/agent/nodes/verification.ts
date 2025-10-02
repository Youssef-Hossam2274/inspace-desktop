// verification.ts - FIXED VERSION
import { GraphState } from "../GraphState";

export async function verificationNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("\n[VERIFICATION] Checking iteration results...");
  console.log(`[VERIFICATION] Iteration ${state.iteration_count}`);

  if (!state.action_plan) {
    return { status: "running" };
  }

  if (!state.perception_result) {
    return {
      status: "failed",
      last_error: "No perception result for verification",
      errors: [...state.errors, "No perception result for verification"],
    };
  }

  const batchVerification = state.action_plan.batch_verification;

  // No verification criteria = assume success
  if (!batchVerification?.success_criteria?.length) {
    console.log("[VERIFICATION] No criteria - assuming success");

    // Clear action results so LLM gets fresh context
    return {
      status: "running",
      action_results: [], // RESET for next iteration
    };
  }

  console.log(
    `[VERIFICATION] Checking ${batchVerification.success_criteria.length} criteria`
  );

  const elements = state.perception_result.elements;
  let allPassed = true;

  for (const criterion of batchVerification.success_criteria) {
    const passed = checkCriterion(criterion, elements);

    if (!passed) {
      console.log(
        `[VERIFICATION] ✗ FAILED: ${criterion.type} - "${criterion.content}"`
      );
      allPassed = false;
    } else {
      console.log(
        `[VERIFICATION] ✓ PASSED: ${criterion.type} - "${criterion.content}"`
      );
    }
  }

  if (allPassed) {
    console.log("[VERIFICATION] ✓ All criteria passed");

    // IMPORTANT: Clear action_results for next iteration
    // This prevents LLM from seeing old actions and repeating them
    return {
      status: "running",
      action_results: [], // RESET for fresh context
      verification_passed: true, // Flag for routing
    };
  } else {
    console.log("[VERIFICATION] ✗ Verification failed - will retry");

    // Keep action_results so LLM can see what failed
    return {
      status: "running",
      verification_passed: false, // Flag for routing
    };
  }
}

function checkCriterion(
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
      console.warn(`[VERIFICATION] Unknown criterion type: ${criterion.type}`);
      return true;
  }
}
