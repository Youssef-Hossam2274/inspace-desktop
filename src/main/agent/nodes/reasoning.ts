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
      `[Reasoning] Perception has ${state.perception_result.elements.length} elements`
    );

    const filteredElements = ElementFilter.filterAndPrioritize(
      state.perception_result.elements,
      state.user_prompt,
      state.action_results || []
    );

    console.log(
      `[Reasoning] Filtered to ${filteredElements.length} elements for LLM context`
    );

    const context = {
      user_prompt: state.user_prompt,
      current_elements: filteredElements,
      iteration_count: state.iteration_count,
      previous_actions: state.action_results || [],
      test_id: state.test_id,
    };

    console.log("[Reasoning] Calling LLM for action plan generation...");
    console.log(
      `[Reasoning] Sample element IDs: ${filteredElements
        .map((e) => e.elementId)
        .slice(0, 5)
        .join(", ")}...`
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

    // If LLM says task is complete (no actions), end workflow
    if (!actionPlan.actions || actionPlan.actions.length === 0) {
      console.log("[Reasoning] LLM generated no actions - task complete");
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
      `[Reasoning] Generated action plan with ${actionPlanWithBboxes.actions.length} actions`
    );
    console.log(`[Reasoning] Next action: ${actionPlanWithBboxes.next_action}`);

    // Log all actions in the plan
    actionPlanWithBboxes.actions.forEach(
      (action: {
        step_id: any;
        action_type: any;
        description: any;
        target: { elementId: any; bbox: any[] };
      }) => {
        console.log(
          `  [${action.step_id}] ${action.action_type}: ${action.description}`
        );
        if (action.target?.elementId) {
          console.log(
            `      Element: ${action.target.elementId} at bbox: [${action.target.bbox?.map((n) => n.toFixed(3)).join(", ")}]`
          );
        }
      }
    );

    // Log batch verification criteria if present
    if (actionPlanWithBboxes.batch_verification?.success_criteria) {
      console.log(
        `[Reasoning] Batch verification criteria (${actionPlanWithBboxes.batch_verification.success_criteria.length} checks):`
      );
      actionPlanWithBboxes.batch_verification.success_criteria.forEach(
        (c: any, i: number) => {
          console.log(`    ${i + 1}. ${c.type}: "${c.content}"`);
        }
      );
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
