import fs from "fs";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
import { actionNode } from "./nodes/action.js";
import { verificationNode } from "./nodes/verification.js";
import { GraphState } from "./GraphState.js";
import { errorRecoveryNode } from "./nodes/error.js";
import {
  afterAction,
  afterReasoning,
  afterVerification,
  afterErrorRecovery,
} from "./nodes/conditional.js";
import { StateGraph, Annotation } from "@langchain/langgraph";
// import { drawGraph } from "@langchain/langgraph/dist/draw";

export async function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    .addNode("action", actionNode)
    .addNode("verification", verificationNode)
    .addNode("error_recovery", errorRecoveryNode)

    .setEntryPoint("perception")
    .addEdge("perception", "reasoning")

    // decide if we need verification first or go straight to action
    .addConditionalEdges("reasoning", afterReasoning, {
      verification: "verification",
      action: "action",
      end: "__end__",
    })

    // check if successful or needs recovery
    .addConditionalEdges("action", afterAction, {
      perception: "perception",
      error_recovery: "error_recovery",
      end: "__end__",
    })

    // After verification continue or recover
    .addConditionalEdges("verification", afterVerification, {
      perception: "perception",
      error_recovery: "error_recovery",
      end: "__end__",
    })

    // After error recovery: retry or give up
    .addConditionalEdges("error_recovery", afterErrorRecovery, {
      perception: "perception",
      end: "__end__",
    });

  const compiled = workflow.compile();
  const graphObj = compiled.getGraph();
  const mermaidSource = graphObj.drawMermaid();
  fs.writeFileSync("workflow.mmd", mermaidSource);
  console.log(
    "Saved workflow.mmd. Open it in VSCode Mermaid extension or any Mermaid live editor."
  );
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
    max_retries: 3,
    verification_needed: false,
  };
}

export async function executeAgentWorkflow(
  userPrompt: string,
  testId?: string
) {
  console.log(`[Graph] Starting agent workflow for prompt: "${userPrompt}"`);

  const graph = createAgentWorkflow();
  const initialState = createInitialState(userPrompt, testId);

  try {
    const result = await (await graph).invoke(initialState);
    console.log("[Graph] Workflow completed successfully");
    console.log(`[Graph] Final status: ${result.status}`);
    console.log(`[Graph] Total iterations: ${result.iteration_count}`);
    console.log(`[Graph] Total errors: ${result.errors?.length || 0}`);
    return result;
  } catch (error) {
    console.error("[Graph] Workflow failed with exception:", error);
    throw error;
  }
}
