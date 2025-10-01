import { StateGraph, Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
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
  element_map: Annotation<Map<string, [number, number, number, number]>>,
  retry_count: Annotation<number>,
  max_retries: Annotation<number>,
});
