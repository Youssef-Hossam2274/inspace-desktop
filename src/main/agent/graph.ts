import fs from "fs";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
import { actionNode } from "./nodes/action.js";
import { verificationNode } from "./nodes/verification.js";
import { GraphState } from "./GraphState.js";
import { errorRecoveryNode } from "./nodes/error.js";
import { approvalNode, afterApproval } from "./nodes/approval.js";
import {
  afterAction,
  afterReasoning,
  afterVerification,
  afterErrorRecovery,
} from "./nodes/conditional.js";
import { StateGraph, MemorySaver, interrupt } from "@langchain/langgraph";

export async function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    .addNode("approval", approvalNode)
    .addNode("action", actionNode)
    .addNode("verification", verificationNode)
    .addNode("error_recovery", errorRecoveryNode)

    .setEntryPoint("perception")

    .addEdge("perception", "reasoning")

    // After reasoning: go to approval or end
    .addConditionalEdges("reasoning", afterReasoning, {
      approval: "approval",
      end: "__end__",
    })

    // After approval node, route based on user decision
    .addConditionalEdges("approval", afterApproval, {
      action: "action",
      perception: "perception",
    })

    // After action: continue or verify or error
    .addConditionalEdges("action", afterAction, {
      action: "action",
      verification: "verification",
      error_recovery: "error_recovery",
    })

    // After verification: continue or end
    .addConditionalEdges("verification", afterVerification, {
      perception: "perception",
      end: "__end__",
    })

    // After error recovery: retry or end
    .addConditionalEdges("error_recovery", afterErrorRecovery, {
      perception: "perception",
      end: "__end__",
    });

  // Use MemorySaver for checkpointing
  const checkpointer = new MemorySaver();
  const compiled = workflow.compile({
    checkpointer,
    interruptBefore: ["approval"], // This will pause BEFORE approval node
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
  };
}

export async function executeAgentWorkflow(
  userPrompt: string,
  testId?: string,
  onApprovalNeeded?: (
    state: typeof GraphState.State
  ) => Promise<"approve" | "retry">
) {
  console.log(`User Goal: "${userPrompt}"`);
  const graph = await createAgentWorkflow();
  let currentState = createInitialState(userPrompt, testId);

  // Create a unique thread ID for this workflow execution
  const threadId = testId || `thread_${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  try {
    while (true) {
      console.log(
        `[WORKFLOW] Invoking graph with status: ${currentState.status}`
      );

      // Invoke the graph - will stop at interruption points
      let result = await graph.invoke(currentState, config);

      console.log(`[WORKFLOW] Graph returned with status: ${result.status}`);

      // Get the current state from checkpointer to see where we are
      const checkpointState = await graph.getState(config);
      console.log(`[WORKFLOW] Checkpoint - Next node: ${checkpointState.next}`);

      // Check if we're interrupted at approval node
      if (checkpointState.next && checkpointState.next.includes("approval")) {
        console.log("[WORKFLOW] ⏸️  Graph interrupted before approval node");

        if (!onApprovalNeeded) {
          console.error("[WORKFLOW] No approval callback provided!");
          return {
            ...result,
            status: "failed" as const,
            last_error: "No approval callback provided",
            errors: [...result.errors, "No approval callback provided"],
          };
        }

        // Wait for user decision
        console.log("[WORKFLOW] Requesting user approval...");
        const decision = await onApprovalNeeded(result);

        console.log(`[WORKFLOW] ▶️  User decision: ${decision}`);

        // Update ONLY the specific fields in the checkpoint
        console.log(
          "[WORKFLOW] Updating checkpoint state with user decision..."
        );
        await graph.updateState(config, {
          user_decision: decision,
          pending_approval: false,
        });

        // Resume from approval node - it will now see the user_decision
        console.log("[WORKFLOW] Resuming execution...");
        result = await graph.invoke(null, config);

        // Update currentState with result after approval
        currentState = result;

        continue;
      }

      // Check for completion
      if (result.status === "completed") {
        console.log(`[WORKFLOW] ✅ Task completed successfully!`);
        console.log(`Total Iterations: ${result.iteration_count}`);
        console.log(`Actions Executed: ${result.action_results?.length || 0}`);
        return result;
      }

      if (result.status === "failed") {
        console.log(`[WORKFLOW] ❌ Task failed`);
        console.log(`Error: ${result.last_error}`);
        console.log(`Total Errors: ${result.errors?.length || 0}`);
        return result;
      }

      // If we reach here without interruption and status is running, workflow completed
      if (result.status === "running" && !checkpointState.next) {
        console.log(`[WORKFLOW] ✅ Workflow completed normally`);
        return {
          ...result,
          status: "completed" as const,
        };
      }

      // Update state and continue
      currentState = result;
    }
  } catch (error) {
    console.error(`[WORKFLOW] Fatal error:`, error);
    throw error;
  }
}
