import { GraphState } from "../GraphState";

export async function verificationNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("\n[VERIFICATION] Starting iteration verification...");
  console.log(`[VERIFICATION] Iteration ${state.iteration_count}`);

  if (!state.action_plan) {
    console.log("[VERIFICATION] No action plan - skipping verification");
    return {
      status: "running",
    };
  }

  if (!state.perception_result) {
    console.error("[VERIFICATION] No perception result available!");
    return {
      status: "failed",
      last_error: "No perception result for verification",
      errors: [...state.errors, "No perception result for verification"],
    };
  }

  const batchVerification = state.action_plan.batch_verification;

  if (
    !batchVerification?.success_criteria ||
    batchVerification.success_criteria.length === 0
  ) {
    console.log(
      "[VERIFICATION] No success criteria defined - iteration complete"
    );
    return {
      status: "running",
      retry_count: 0, // Reset retry count on successful iteration
    };
  }

  console.log(
    `[VERIFICATION] Checking ${batchVerification.success_criteria.length} criteria:`
  );

  const elements = state.perception_result.elements;
  console.log(`[VERIFICATION] Available elements: ${elements.length}`);

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
    console.log("[VERIFICATION] ✓ All criteria passed - iteration successful");
    return {
      status: "running",
      retry_count: 0, // Reset retry count
    };
  } else {
    console.log("[VERIFICATION] ✗ Some criteria failed");
    const retryCount = state.retry_count || 0;

    return {
      status: "running",
      retry_count: retryCount + 1,
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
