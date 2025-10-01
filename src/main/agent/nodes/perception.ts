import { AgentState, UIElement } from "../types";
import {
  captureScreenshot,
  captureMultipleRegions,
  multiRegionCoordsToScreen,
} from "../../services/screenshotService.js";
import { callPerceptionApi } from "../../services/perceptionAPI.js";

const GRID_CONFIG = {
  rows: 4,
  cols: 4,
  enabled: true,
};

export async function perceptionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log(
    `\n========== ITERATION ${state.iteration_count + 1} - PERCEPTION ==========`
  );

  try {
    const useGridPerception = GRID_CONFIG.enabled && state.iteration_count > 0;

    let perceptionResult;
    if (useGridPerception) {
      console.log("[Perception] Using grid-based perception");
      perceptionResult = await gridBasedPerception(state);
    } else {
      console.log("[Perception] Using full-screen perception (initial)");
      perceptionResult = await fullScreenPerception(state);
    }

    if (perceptionResult.perception_result) {
      const elementMap = new Map<string, [number, number, number, number]>();
      perceptionResult.perception_result.elements.forEach((el: UIElement) => {
        elementMap.set(el.elementId, el.bbox);
      });

      console.log(
        `[Perception] Created element map with ${elementMap.size} entries`
      );

      return {
        ...perceptionResult,
        element_map: elementMap,
        // Increment iteration count at start of each iteration (perception phase)
        iteration_count: state.iteration_count + 1,
      };
    }

    return perceptionResult;
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

async function fullScreenPerception(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("[Perception] Capturing full screenshot...");
  const screenshot = await captureScreenshot();
  if (!screenshot) {
    const error = "Failed to capture screenshot";
    console.error(`[Perception] ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error],
    };
  }
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

  return {
    perception_result: {
      ...perceptionResult,
      elements: elementsWithIds,
    },
    status: "running",
  };
}

async function gridBasedPerception(
  state: AgentState
): Promise<Partial<AgentState>> {
  const targetRegions = selectTargetRegions(state);
  console.log(`[Perception] Analyzing regions: ${targetRegions.join(", ")}`);

  const captureResult = await captureMultipleRegions(
    targetRegions,
    GRID_CONFIG.rows,
    GRID_CONFIG.cols
  );

  if (!captureResult) {
    const error = "Failed to capture multi-region screenshot";
    console.error(`[Perception] ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error],
    };
  }
  const { screenshot, regionBounds } = captureResult;
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

  console.log(
    `[Perception] Found ${perceptionResult.elements.length} elements in combined region`
  );

  const transformedElements = perceptionResult.elements.map((el, index) => ({
    ...el,
    elementId: `elem_${state.iteration_count}_${index}`,
    bbox: multiRegionCoordsToScreen(el.bbox, regionBounds),
  }));

  console.log(
    `[Perception] Transformed ${transformedElements.length} elements to screen coordinates`
  );

  return {
    perception_result: {
      elements: transformedElements,
      screenshot: screenshot,
      success: true,
    },
    status: "running",
  };
}

function selectTargetRegions(state: AgentState): number[] {
  if (state.action_results && state.action_results.length > 0) {
    if (state.action_plan?.actions && state.action_plan.actions.length > 0) {
      const lastPlannedAction =
        state.action_plan.actions[state.action_plan.actions.length - 1];

      if (lastPlannedAction.target?.bbox) {
        const targetRegion = bboxToRegionIndex(
          lastPlannedAction.target.bbox,
          GRID_CONFIG.rows,
          GRID_CONFIG.cols
        );

        console.log(
          `[Perception] Focusing on region ${targetRegion} and neighbors (from last action)`
        );
        return getRegionWithNeighbors(
          targetRegion,
          GRID_CONFIG.rows,
          GRID_CONFIG.cols
        );
      }
    }
  }

  if (state.iteration_count === 0) {
    console.log("[Perception] First iteration - analyzing center regions");
    return getCenterRegions(GRID_CONFIG.rows, GRID_CONFIG.cols);
  }

  console.log("[Perception] Fallback - analyzing all regions");
  const totalRegions = GRID_CONFIG.rows * GRID_CONFIG.cols;
  return Array.from({ length: totalRegions }, (_, i) => i);
}

function bboxToRegionIndex(
  bbox: [number, number, number, number],
  rows: number,
  cols: number
): number {
  const centerX = (bbox[0] + bbox[2]) / 2;
  const centerY = (bbox[1] + bbox[3]) / 2;
  const col = Math.floor(centerX * cols);
  const row = Math.floor(centerY * rows);
  return row * cols + col;
}

function getRegionWithNeighbors(
  regionIndex: number,
  rows: number,
  cols: number
): number[] {
  const row = Math.floor(regionIndex / cols);
  const col = regionIndex % cols;

  const regions: number[] = [];

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        regions.push(r * cols + c);
      }
    }
  }

  return regions;
}

function getCenterRegions(rows: number, cols: number): number[] {
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);

  return [
    (centerRow - 1) * cols + (centerCol - 1),
    (centerRow - 1) * cols + centerCol,
    centerRow * cols + (centerCol - 1),
    centerRow * cols + centerCol,
  ].filter((idx) => idx >= 0 && idx < rows * cols);
}
