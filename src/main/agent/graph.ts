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
import { StateGraph } from "@langchain/langgraph";

export async function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    .addNode("action", actionNode)
    .addNode("verification", verificationNode)
    .addNode("error_recovery", errorRecoveryNode)

    // Always start with perception
    .setEntryPoint("perception")

    // After perception, always go to reasoning
    .addEdge("perception", "reasoning")

    // After reasoning: either execute actions or end (if LLM says complete)
    .addConditionalEdges("reasoning", afterReasoning, {
      action: "action",
      end: "__end__",
    })

    // After action: continue to next action, verify batch, or handle errors
    .addConditionalEdges("action", afterAction, {
      action: "action", // Continue with next action in sequence
      verification: "verification", // All actions done, verify batch
      error_recovery: "error_recovery",
      end: "__end__",
    })

    // After verification: start new iteration or end
    .addConditionalEdges("verification", afterVerification, {
      perception: "perception", // Start new iteration
      error_recovery: "error_recovery",
      end: "__end__",
    })

    // After error recovery: retry from perception or end
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
  };
}

export async function executeAgentWorkflow(
  userPrompt: string,
  testId?: string
) {
  console.log(`\n==========================================`);
  console.log(`Starting agent workflow for prompt: "${userPrompt}"`);
  console.log(`==========================================\n`);

  const graph = createAgentWorkflow();
  const initialState = createInitialState(userPrompt, testId);

  try {
    const result = await (await graph).invoke(initialState);

    console.log(`\n==========================================`);
    console.log(`Workflow completed`);
    console.log(`==========================================`);
    console.log(`Final status: ${result.status}`);
    console.log(`Total iterations: ${result.iteration_count}`);
    console.log(
      `Total actions executed: ${result.action_results?.length || 0}`
    );
    console.log(`Total errors: ${result.errors?.length || 0}`);

    if (result.errors?.length > 0) {
      console.log(`\nErrors encountered:`);
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    return result;
  } catch (error) {
    console.error(`\n==========================================`);
    console.error(`Workflow failed with exception`);
    console.error(`==========================================`);
    console.error(error);
    throw error;
  }
}
