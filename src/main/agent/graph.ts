import { StateGraph, Annotation } from "@langchain/langgraph";
import { perceptionNode } from "./nodes/perception.js";
import { reasoningNode } from "./nodes/reasoning.js";
// import { actionNode } from "./nodes/action";

// State Schema
const GraphState = Annotation.Root({
  user_prompt: Annotation<string>,
  test_id: Annotation<string>,
  current_screenshot: Annotation<any>,
  perception_result: Annotation<any>,
  action_plan: Annotation<any>,
  action_results: Annotation<any[]>,
  iteration_count: Annotation<number>,
  max_iterations: Annotation<number>,
  status: Annotation<"running" | "completed" | "failed">,
  errors: Annotation<string[]>,
  last_error: Annotation<string>,
});

function shouldContinue(state: typeof GraphState.State): string {
  console.log(
    `Checking continue condition. Status: ${state.status}, Iteration: ${state.iteration_count}/${state.max_iterations}`
  );
  if (state.iteration_count >= state.max_iterations) {
    console.log("Max iterations reached");
    return "end";
  }

  if (state.status === "failed") {
    console.log("Failed status detected");
    return "end";
  }

  if (state.status === "completed") {
    console.log("Completed status detected");
    return "end";
  }

  if (state.action_plan?.next_action === "complete") {
    console.log("Action plan indicates completion");
    return "end";
  }

  if (state.action_plan?.next_action === "continue") {
    console.log("Action plan indicates continue - taking new screenshot");
    return "perception";
  }

  console.log("Continuing normal flow");
  return "reasoning";
}

function checkActionResults(state: typeof GraphState.State): string {
  console.log(
    `Checking action results. Results count: ${state.action_results?.length || 0}`
  );

  if (!state.action_results || state.action_results.length === 0) {
    console.log("No action results found");
    return "end";
  }

  const failedActions = state.action_results.filter(
    (result) => !result.success
  );
  if (failedActions.length > 0) {
    console.log(`Found ${failedActions.length} failed actions`);
    //  implement retry logic here
    return "end";
  }

  console.log("[Graph] All actions succeeded, checking continuation");
  return "continue_check";
}

// Create the workflow graph
export function createAgentWorkflow() {
  const workflow = new StateGraph(GraphState)
    .addNode("perception", perceptionNode)
    .addNode("reasoning", reasoningNode)
    // .addNode("action", actionNode)
    .addEdge("perception", "reasoning")
    // .addEdge("reasoning", "action")
    // .addConditionalEdges(
    //   "action",
    //   checkActionResults,
    //   {
    //     "continue_check": "continue_check",
    //     "end": "__end__"
    //   }
    // )
    // .addConditionalEdges(
    //   "continue_check",
    //   shouldContinue,
    //   {
    //     "perception": "perception",
    //     "reasoning": "reasoning",
    //     "end": "__end__"
    //   }
    // )
    // .addNode("continue_check", (state: typeof GraphState.State) => {
    //   // This is just a pass-through node for conditional logic
    //   console.log("[Graph] Continue check node");
    //   return {
    //     iteration_count: state.iteration_count + 1
    //   };
    // })
    .setEntryPoint("perception");

  return workflow.compile();
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
    const result = await graph.invoke(initialState);
    console.log("Workflow completed successfully");
    return result;
  } catch (error) {
    console.error("Workflow failed:", error);
    throw error;
  }
}
