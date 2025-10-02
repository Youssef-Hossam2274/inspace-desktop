import { AgentState, UIElementForLLM } from "../types";
import { callLLMApi } from "../../services/llm/llmAPI.js";
import { ElementFilter } from "../../services/llm/ElementFilter.js";

export async function reasoningNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log(`\n[REASONING] Starting - Iteration ${state.iteration_count}`);

  try {
    if (!state.perception_result) {
      const error = "No perception result available for reasoning";
      console.error(`[Reasoning] ${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }

    console.log(
      `[Reasoning] Perception detected ${state.perception_result.elements.length} elements`
    );

    // Filter elements for LLM context
    // const filteredElements = ElementFilter.filterAndPrioritize(
    //   state.perception_result.elements,
    //   state.user_prompt,
    //   state.action_results || []
    // );
    const filteredElements = state.perception_result.elements;
    console.log(
      `[Reasoning] Filtered to ${filteredElements.length} elements for LLM`
    );

    // Build context with iteration awareness
    const context = {
      user_prompt: state.user_prompt,
      current_elements: filteredElements,
      iteration_count: state.iteration_count,
      previous_actions: state.action_results || [],
      test_id: state.test_id,
    };

    console.log("[Reasoning] Calling LLM for action plan...");
    console.log(
      `[Reasoning] Context: ${filteredElements.length} elements, ${context.previous_actions.length} previous actions`
    );

    const actionPlan = await callLLMApi(context);

    if (!actionPlan) {
      const error = "LLM failed to generate action plan";
      console.error(`[Reasoning] ${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }

    if (
      !actionPlan.actions ||
      actionPlan.actions.length === 0 ||
      actionPlan.next_action === "complete"
    ) {
      console.log("[Reasoning] LLM indicates task is COMPLETE");
      return {
        status: "completed",
        action_plan: {
          ...actionPlan,
          status: "completed",
          next_action: "complete",
          actions: [],
          current_step: 0,
        },
      };
    }

    // Resolve element IDs to bboxes
    const actionPlanWithBboxes = resolveElementIds(
      actionPlan,
      state.element_map
    );

    actionPlanWithBboxes.current_step = 0;
    actionPlanWithBboxes.status = "in_progress";

    console.log(
      `[Reasoning] Generated plan with ${actionPlanWithBboxes.actions.length} actions for this iteration`
    );
    console.log(
      `[Reasoning] Next action type: ${actionPlanWithBboxes.next_action}`
    );

    // Log all actions
    actionPlanWithBboxes.actions.forEach(
      (action: {
        step_id: any;
        action_type: any;
        description: any;
        target?: { elementId: any; bbox?: any[] };
        parameters?: any;
      }) => {
        console.log(
          `  [${action.step_id}] ${action.action_type}: ${action.description}`
        );
        if (action.target?.elementId) {
          console.log(
            `      Element: ${action.target.elementId}${action.target.bbox ? ` at [${action.target.bbox.map((n) => n.toFixed(3)).join(", ")}]` : ""}`
          );
        }
        if (action.parameters) {
          console.log(`      Parameters: ${JSON.stringify(action.parameters)}`);
        }
      }
    );

    // Log verification criteria
    if (actionPlanWithBboxes.batch_verification?.success_criteria) {
      console.log(
        `[Reasoning] Verification criteria (${actionPlanWithBboxes.batch_verification.success_criteria.length} checks):`
      );
      actionPlanWithBboxes.batch_verification.success_criteria.forEach(
        (c: any, i: number) => {
          console.log(`    ${i + 1}. ${c.type}: "${c.content}"`);
        }
      );
    } else {
      console.log("[Reasoning] No verification criteria defined");
    }

    return {
      action_plan: actionPlanWithBboxes,
      status: "running",
    };
  } catch (error) {
    const errorMsg = `Reasoning node error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Reasoning] ${errorMsg}`);

    return {
      status: "failed",
      last_error: errorMsg,
      errors: [...state.errors, errorMsg],
    };
  }
}

function resolveElementIds(
  actionPlan: any,
  elementMap?: Map<string, [number, number, number, number]>
): any {
  if (!elementMap) {
    console.warn(
      "[Reasoning] No element_map available, cannot resolve elementIds"
    );
    return actionPlan;
  }

  const resolvedActions = actionPlan.actions.map((action: any) => {
    const resolvedAction = { ...action };

    // Resolve main target
    if (action.target?.elementId) {
      const bbox = elementMap.get(action.target.elementId);
      if (bbox) {
        resolvedAction.target.bbox = bbox;
        console.log(
          `[Reasoning] Resolved ${action.target.elementId} → [${bbox.map((n) => n.toFixed(3)).join(", ")}]`
        );
      } else {
        console.warn(
          `[Reasoning] Could not resolve elementId: ${action.target.elementId}`
        );
      }
    }

    // Resolve drag_and_drop parameters
    if (action.action_type === "drag_and_drop" && action.parameters) {
      if (action.parameters.from_elementId) {
        const fromBbox = elementMap.get(action.parameters.from_elementId);
        if (fromBbox) {
          resolvedAction.parameters.from_bbox = fromBbox;
          console.log(
            `[Reasoning] Resolved from_elementId ${action.parameters.from_elementId}`
          );
        }
      }
      if (action.parameters.to_elementId) {
        const toBbox = elementMap.get(action.parameters.to_elementId);
        if (toBbox) {
          resolvedAction.parameters.to_bbox = toBbox;
          console.log(
            `[Reasoning] Resolved to_elementId ${action.parameters.to_elementId}`
          );
        }
      }
    }

    return resolvedAction;
  });

  return {
    ...actionPlan,
    actions: resolvedActions,
  };
}
