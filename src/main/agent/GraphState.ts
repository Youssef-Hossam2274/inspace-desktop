import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  user_prompt: Annotation<string>,
  test_id: Annotation<string>,
  current_screenshot: Annotation<any>,
  perception_result: Annotation<any>,
  action_plan: Annotation<any>,
  element_map: Annotation<Map<string, [number, number, number, number]>>,
  action_results: Annotation<any[]>,
  iteration_count: Annotation<number>,
  max_iterations: Annotation<number>,
  retry_count: Annotation<number>,
  max_retries: Annotation<number>,
  status: Annotation<"running" | "completed" | "failed" | "awaiting_approval">,
  errors: Annotation<string[]>,
  last_error: Annotation<string>,
  pending_approval: Annotation<boolean>,
  user_decision: Annotation<"approve" | "retry" | null>,
  verification_passed: Annotation<boolean | undefined>,
});
