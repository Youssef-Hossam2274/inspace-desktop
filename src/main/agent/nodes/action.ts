import { AgentState, ActionResult } from "../types";
import { captureScreenshot } from "../../services/screenshotService.js";
import {
  leftClickAction,
  rightClickAction,
  leftDoubleClickAction,
} from "../../NutActions/actions/click.js";
import { moveMouse } from "../../NutActions/actions/moveMouse.js";
import { typingAction } from "../../NutActions/actions/typing.js";
import { keyPressAction } from "../../NutActions/actions/keypress.js";
import { keyComboAction } from "../../NutActions/actions/keycombo.js";
import { hoverAction } from "../../NutActions/actions/hover.js";
import { scrollAction } from "../../NutActions/actions/scroll.js";
import { copyAction } from "../../NutActions/actions/copy.js";
import { pasteAction } from "../../NutActions/actions/paste.js";
import { clearInputAction } from "../../NutActions/actions/clearInput.js";
import { waitAction } from "../../NutActions/actions/wait.js";

export async function actionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("\n[ACTION] Executing action...");

  const currentStepIndex = state.action_plan?.current_step ?? 0;
  const currentStep = state.action_plan?.actions[currentStepIndex];

  if (!currentStep) {
    console.warn("[ACTION] No current step found in action plan");
    return {
      status: "failed",
      last_error: "No current action step found",
      errors: [...state.errors, "No current action step found"],
    };
  }

  const totalActions = state.action_plan?.actions.length ?? 0;
  console.log(
    `[ACTION] Executing step ${currentStepIndex + 1}/${totalActions}`
  );
  console.log(`[ACTION] Step ID: ${currentStep.step_id}`);
  console.log(`[ACTION] Type: ${currentStep.action_type}`);
  console.log(`[ACTION] Description: ${currentStep.description}`);

  let executionResult;
  const dummyEvent = null as any;

  try {
    switch (currentStep.action_type) {
      case "click":
        if (!currentStep.target?.bbox) {
          throw new Error(
            `Missing bbox for action: ${currentStep.action_type}`
          );
        }
        executionResult = await leftClickAction(dummyEvent, {
          bbox: currentStep.target.bbox,
        });
        break;

      case "double_click":
        if (!currentStep.target?.bbox) {
          throw new Error(
            `Missing bbox for action: ${currentStep.action_type}`
          );
        }
        executionResult = await leftDoubleClickAction(dummyEvent, {
          bbox: currentStep.target.bbox,
        });
        break;

      case "right_click":
        if (!currentStep.target?.bbox) {
          throw new Error(
            `Missing bbox for action: ${currentStep.action_type}`
          );
        }
        executionResult = await rightClickAction(dummyEvent, {
          bbox: currentStep.target.bbox,
        });
        break;

      case "move_mouse":
      case "hover":
        if (!currentStep.target?.bbox) {
          throw new Error(
            `Missing bbox for action: ${currentStep.action_type}`
          );
        }
        executionResult =
          currentStep.action_type === "hover"
            ? await hoverAction(dummyEvent, { bbox: currentStep.target.bbox })
            : await moveMouse(dummyEvent, { bbox: currentStep.target.bbox });
        break;

      case "type":
        if (!currentStep.target?.bbox) {
          throw new Error("Missing bbox for typing action");
        }
        if (!currentStep.parameters?.text) {
          throw new Error("No text provided for type action");
        }
        executionResult = await typingAction(dummyEvent, {
          bbox: currentStep.target.bbox,
          text: currentStep.parameters.text,
        });
        break;

      case "key_press":
        if (!currentStep.parameters?.key) {
          throw new Error("No key provided for key_press action");
        }
        executionResult = await keyPressAction(dummyEvent, {
          key: currentStep.parameters.key,
        });
        break;

      case "key_combo":
        if (
          !currentStep.parameters?.keys ||
          !Array.isArray(currentStep.parameters.keys)
        ) {
          throw new Error("No keys array provided for key_combo action");
        }
        executionResult = await keyComboAction(dummyEvent, {
          keys: currentStep.parameters.keys,
        });
        break;

      case "copy":
        executionResult = await copyAction(dummyEvent);
        break;

      case "paste":
        executionResult = await pasteAction(dummyEvent);
        break;

      case "clear_input":
        if (!currentStep.target?.bbox) {
          throw new Error("Missing bbox for clear_input action");
        }
        executionResult = await clearInputAction(dummyEvent, {
          bbox: currentStep.target.bbox,
        });
        break;

      case "wait":
        if (!currentStep.parameters?.duration) {
          throw new Error("Missing duration for wait action");
        }
        executionResult = await waitAction(dummyEvent, {
          duration: currentStep.parameters.duration,
        });
        break;

      default:
        executionResult = {
          success: false,
          error: `Action type "${currentStep.action_type}" not implemented`,
        };
    }
  } catch (error) {
    executionResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (!executionResult.success) {
    console.error(`[ACTION] Execution failed: ${executionResult.error}`);

    const result: ActionResult = {
      step_id: currentStep.step_id,
      success: false,
      error: executionResult.error,
    };

    return {
      action_results: [...(state.action_results || []), result],
      last_error: executionResult.error,
      errors: [
        ...state.errors,
        executionResult.error || "Action execution failed",
      ],
      status: "running",
    };
  }

  console.log(`[ACTION] ✓ Action completed successfully`);

  const result: ActionResult = {
    step_id: currentStep.step_id,
    success: true,
  };

  const nextStep = currentStepIndex + 1;
  const allActionsComplete = nextStep >= totalActions;

  if (allActionsComplete) {
    console.log(`[ACTION] All ${totalActions} actions in plan completed`);
  } else {
    console.log(
      `[ACTION] Moving to next action: ${nextStep + 1}/${totalActions}`
    );
  }

  return {
    action_results: [...(state.action_results || []), result],
    action_plan: state.action_plan
      ? {
          ...state.action_plan,
          current_step: nextStep,
        }
      : undefined,
    status: "running",
  };
}
