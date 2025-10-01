import { GraphState } from "../GraphState";

export async function verificationNode(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("[Verification] Starting batch verification for iteration...");

  if (!state.action_plan) {
    console.log("[Verification] No action plan - cannot verify");
    return {
      status: "failed",
      last_error: "No action plan for verification",
      errors: [...state.errors, "No action plan for verification"],
    };
  }

  const batchVerification = state.action_plan.batch_verification;
  if (batchVerification?.success_criteria) {
    console.log(
      `[Verification] Checking ${batchVerification.success_criteria.length} criteria:`
    );
    batchVerification.success_criteria.forEach(
      (c: { type: string; content: string }, i: number) => {
        console.log(`  ${i + 1}. ${c.type}: "${c.content}"`);
      }
    );
  } else {
    console.log("[Verification] No success criteria defined");
  }

  return {
    status: "running",
  };
}
