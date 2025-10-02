// graph.ts - SIMPLIFIED VERSION
import fs from "fs";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
import { actionNode } from "./nodes/action.js";
import { verificationNode } from "./nodes/verification.js";
import { GraphState } from "./GraphState.js";
import { approvalNode } from "./nodes/approval.js";
import { StateGraph, MemorySaver } from "@langchain/langgraph";
import {
  afterVerification,
  afterAction,
  afterApproval,
  afterReasoning,
} from "./nodes/conditional.js";
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

      if (result.status === "completed" || result.status === "failed") {
        console.log(`[WORKFLOW] Task ${result.status}`);
        return result;
      }

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
