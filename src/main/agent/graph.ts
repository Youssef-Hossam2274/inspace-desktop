import fs from "fs";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
import { actionNode } from "./nodes/action.js";
import { verificationNode } from "./nodes/verification.js";
import { GraphState } from "./GraphState.js";
import { errorRecoveryNode } from "./nodes/error.js";
import {
  afterPerception,
  afterAction,
  afterReasoning,
  afterVerification,
  afterErrorRecovery,
} from "./nodes/conditional.js";
import { StateGraph } from "@langchain/langgraph";

export async function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    .addNode("action", actionNode)
    .addNode("verification", verificationNode)
    .addNode("error_recovery", errorRecoveryNode)

    // Start each iteration with perception
    .setEntryPoint("perception")

    // After perception: always reason about current state
    .addEdge("perception", "reasoning")

    // After reasoning: execute actions or end if task complete
    .addConditionalEdges("reasoning", afterReasoning, {
      action: "action",
      end: "__end__",
    })

    // After action: continue to next action, or verify when batch done
    .addConditionalEdges("action", afterAction, {
      action: "action",
      verification: "verification",
      error_recovery: "error_recovery",
    })

    // After verification: start new iteration or end
    .addConditionalEdges("verification", afterVerification, {
      perception: "perception",
      end: "__end__",
    })

    // After error recovery: retry or end
    .addConditionalEdges("error_recovery", afterErrorRecovery, {
      perception: "perception",
      end: "__end__",
    });

  const compiled = workflow.compile();

  // Save workflow diagram
  try {
    const graphObj = compiled.getGraph();
    const mermaidSource = graphObj.drawMermaid();
    fs.writeFileSync("workflow.mmd", mermaidSource);
    console.log("✓ Saved workflow diagram to workflow.mmd");
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
  };
}

export async function executeAgentWorkflow(
  userPrompt: string,
  testId?: string
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Starting Agent Workflow`);
  console.log(`User Goal: "${userPrompt}"`);
  console.log(`${"=".repeat(60)}\n`);

  const graph = await createAgentWorkflow();
  const initialState = createInitialState(userPrompt, testId);

  try {
    const result = await graph.invoke(initialState, {
      recursionLimit: 50, // Increased limit but workflow should end naturally
    });

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Workflow Completed`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Final Status: ${result.status}`);
    console.log(`Total Iterations: ${result.iteration_count}`);
    console.log(`Actions Executed: ${result.action_results?.length || 0}`);
    console.log(`Errors: ${result.errors?.length || 0}`);

    if (result.errors?.length > 0) {
      console.log(`\nErrors encountered:`);
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    return result;
  } catch (error) {
    console.error(`\n${"=".repeat(60)}`);
    console.error(`Workflow Failed`);
    console.error(`${"=".repeat(60)}`);
    console.error(error);
    throw error;
  }
}
