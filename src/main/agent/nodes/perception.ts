import { AgentState, UIElement } from "../types";
import { captureScreenshot } from "../../services/screenshotService.js";
import { callPerceptionApi } from "../../services/perceptionAPI.js";

export async function perceptionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log(
    `\n========== ITERATION ${state.iteration_count} - PERCEPTION ==========`
  );

  try {
    console.log("Capturing full-screen screenshot...");
    const screenshot = await captureScreenshot();

    if (!screenshot) {
      const error = "Failed to capture screenshot";
      console.error(`${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }

    console.log("Analyzing screenshot with perception API...");
    const perceptionResult = await callPerceptionApi(screenshot);

    if (!perceptionResult.success) {
      const error = `Perception failed: ${perceptionResult.error}`;
      console.error(`[Perception] ${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error],
      };
    }

    const elementsWithIds = perceptionResult.elements.map((el, index) => ({
      ...el,
      elementId: `elem_${state.iteration_count}_${index}`,
    }));

    console.log(
      `[Perception] Successfully detected ${elementsWithIds.length} UI elements`
    );

    const elementMap = new Map<string, [number, number, number, number]>();
    elementsWithIds.forEach((el: UIElement) => {
      elementMap.set(el.elementId, el.bbox);
    });

    console.log(
      `[Perception] Created element map with ${elementMap.size} entries`
    );

    return {
      perception_result: {
        ...perceptionResult,
        elements: elementsWithIds,
      },
      element_map: elementMap,
      status: "running",
      iteration_count: state.iteration_count + 1,
    };
  } catch (error) {
    const errorMsg = `Perception node error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Perception] ${errorMsg}`);

    return {
      status: "failed",
      last_error: errorMsg,
      errors: [...state.errors, errorMsg],
    };
  }
}
