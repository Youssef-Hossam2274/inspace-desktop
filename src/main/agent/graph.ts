// graph.ts - SIMPLIFIED VERSION
import fs from "fs";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
import { actionNode } from "./nodes/action.js";
import { verificationNode } from "./nodes/verification.js";
import { GraphState } from "./GraphState.js";
import { approvalNode } from "./nodes/approval.js";
import { StateGraph, MemorySaver } from "@langchain/langgraph";

function afterReasoning(state: typeof GraphState.State): string {
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

function afterApproval(state: typeof GraphState.State): string {
  if (state.user_decision === "retry") {
    return "perception";
  }
  if (state.user_decision === "abort") {
    return "end";
  }
  return "action";
}

function afterAction(state: typeof GraphState.State): string {
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

function afterVerification(state: typeof GraphState.State): string {
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

function checkVerificationCriteria(
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

export async function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    .addNode("approval", approvalNode)
    .addNode("action", actionNode)
    .addNode("verification", verificationNode)

    .setEntryPoint("perception")

    // Linear flow with simple conditionals
    .addEdge("perception", "reasoning")

    .addConditionalEdges("reasoning", afterReasoning, {
      approval: "approval",
      end: "__end__",
    })

    .addConditionalEdges("approval", afterApproval, {
      action: "action",
      perception: "perception",
      end: "__end__",
    })

    .addConditionalEdges("action", afterAction, {
      action: "action",
      verification: "verification",
      perception: "perception",
      end: "__end__",
    })

    .addConditionalEdges("verification", afterVerification, {
      perception: "perception",
      end: "__end__",
    });

  const checkpointer = new MemorySaver();
  const compiled = workflow.compile({
    checkpointer,
    interruptBefore: ["approval"],
  });

  try {
    const graphObj = compiled.getGraph();
    const mermaidSource = graphObj.drawMermaid();
    fs.writeFileSync("workflow.mmd", mermaidSource);
    console.log("Saved workflow diagram to workflow.mmd");
  } catch (error) {
    console.warn("Could not save workflow diagram:", error);
  }

  return compiled;
}

export function createInitialState(
  userPrompt: string,
  testId?: string
): typeof GraphState.State {
  return {
    user_prompt: userPrompt,
    test_id: testId || `test_${Date.now()}`,
    current_screenshot: null,
    perception_result: null,
    action_plan: null,
    action_results: [],
    iteration_count: 0,
    max_iterations: 10,
    status: "running",
    errors: [],
    last_error: "",
    element_map: new Map(),
    retry_count: 0,
    max_retries: 2,
    pending_approval: false,
    user_decision: null,
    verification_passed: false,
  };
}

export async function executeAgentWorkflow(
  userPrompt: string,
  testId?: string,
  onApprovalNeeded?: (
    state: typeof GraphState.State
  ) => Promise<"approve" | "retry" | "abort">
) {
  console.log(`User Goal: "${userPrompt}"`);
  const graph = await createAgentWorkflow();
  let currentState = createInitialState(userPrompt, testId);

  const threadId = testId || `thread_${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  try {
    while (true) {
      console.log(
        `[WORKFLOW] Invoking graph with status: ${currentState.status}`
      );

      let result = await graph.invoke(currentState, config);
      const checkpointState = await graph.getState(config);

      // Handle approval interruption
      if (checkpointState.next?.includes("approval")) {
        console.log("[WORKFLOW] Paused for approval");

        if (!onApprovalNeeded) {
          throw new Error("No approval callback provided");
        }

        const decision = await onApprovalNeeded(result);
        console.log(`[WORKFLOW] User decision: ${decision}`);
        if (decision === "abort") {
          console.log("[WORKFLOW] User aborted execution");
          await graph.updateState(config, {
            user_decision: "abort",
            status: "aborted",
            pending_approval: false,
          });

          // Invoke one more time to trigger the end transition
          result = await graph.invoke(null, config);
          return { ...result, status: "aborted" as const };
        }
        await graph.updateState(config, {
          user_decision: decision,
          pending_approval: false,
        });

        result = await graph.invoke(null, config);
        currentState = result;
        continue;
      }

      // Check completion
      if (result.status === "completed" || result.status === "failed") {
        console.log(`[WORKFLOW] Task ${result.status}`);
        return result;
      }

      // Workflow completed without explicit status
      if (result.status === "running" && !checkpointState.next) {
        return { ...result, status: "completed" as const };
      }

      currentState = result;
    }
  } catch (error) {
    console.error(`[WORKFLOW] Fatal error:`, error);
    throw error;
  }
}
