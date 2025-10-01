import { AgentState, UIElementForLLM } from "../types";
import { callLLMApi } from "../../services/llm/llmAPI.js";
import { ElementFilter } from "../../services/llm/ElementFilter.js";

export async function reasoningNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log(`Starting reasoning node - Iteration ${state.iteration_count}`);
  try {
    if (!state.perception_result) {
      const error = "No perception result available for reasoning";
      console.error(`${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }
    console.log(
      `Perception result has ${state.perception_result.elements.length} elements`
    );
    const filteredElements = ElementFilter.filterAndPrioritize(
      state.perception_result.elements,
      state.user_prompt,
      state.action_results || []
    );
    // const filteredElements = state.perception_result.elements;
    console.log(
      `Filtered to ${filteredElements.length} elements for LLM context`
    );

    const context = {
      user_prompt: state.user_prompt,
      current_elements: filteredElements,
      iteration_count: state.iteration_count,
      previous_actions: state.action_results || [],
      test_id: state.test_id,
    };
    console.log("Sending context to LLM for action plan generation...");
    console.log(
      `Element IDs: ${filteredElements
        .map((e) => e.elementId)
        .slice(0, 5)
        .join(", ")}...`
    );

    const actionPlan = await callLLMApi(context);
    if (!actionPlan) {
      const error = "LLM failed to generate action plan";
      console.error(`${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }

    if (!actionPlan.actions || actionPlan.actions.length === 0) {
      const error = "Generated action plan contains no actions";
      console.error(`${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }
    const actionPlanWithBboxes = resolveElementIds(
      actionPlan,
      state.element_map
    );
    console.log(
      `Generated action plan with ${actionPlanWithBboxes.actions.length} actions`
    );
    console.log(`Next action directive: ${actionPlanWithBboxes.next_action}`);
    actionPlanWithBboxes.actions.forEach(
      (action: {
        step_id: any;
        action_type: any;
        description: any;
        target: { elementId: any; bbox: any[] };
      }) => {
        console.log(
          `Action ${action.step_id}: ${action.action_type} - ${action.description}`
        );
        if (action.target?.elementId) {
          console.log(
            `  → Element: ${action.target.elementId} → bbox: ${action.target.bbox?.map((n) => n.toFixed(3)).join(",")}`
          );
        }
      }
    );

    return {
      action_plan: actionPlanWithBboxes,
      status: "running",
    };
  } catch (error) {
    const errorMsg = `Reasoning node error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`${errorMsg}`);

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
    console.warn("No element_map available, cannot resolve elementIds");
    return actionPlan;
  }

  const resolvedActions = actionPlan.actions.map((action: any) => {
    const resolvedAction = { ...action };

    if (action.target?.elementId) {
      const bbox = elementMap.get(action.target.elementId);
      if (bbox) {
        resolvedAction.target.bbox = bbox;
        console.log(
          `Resolved ${action.target.elementId} → [${bbox.map((n) => n.toFixed(3)).join(", ")}]`
        );
      } else {
        console.warn(`Could not resolve elementId: ${action.target.elementId}`);
      }
    }

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
