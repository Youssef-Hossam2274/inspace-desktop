import { AgentState } from "../types";
import { captureScreenshot, captureMultipleRegions, multiRegionCoordsToScreen } from "../../services/screenshotService";
import { callPerceptionApi } from "../../services/perceptionAPI";

const GRID_CONFIG = {
  rows: 4,
  cols: 4,
  enabled: true
};

export async function perceptionNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`Starting perception node - Iteration ${state.iteration_count}`);
  
  try {
    const useGridPerception = GRID_CONFIG.enabled && state.iteration_count > 0;
    
    if (useGridPerception) {
      console.log("Using grid-based perception");
      return await gridBasedPerception(state);
    } else {
      console.log("Using full-screen perception");
      return await fullScreenPerception(state);
    }
  } catch (error) {
    const errorMsg = `Perception node error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(` ${errorMsg}`);
    
    return {
      status: "failed",
      last_error: errorMsg,
      errors: [...state.errors, errorMsg]
    };
  }
};


async function fullScreenPerception(state: AgentState): Promise<Partial<AgentState>> {
  console.log("Capturing full screenshot...");
  const screenshot = await captureScreenshot();
  if (!screenshot) {
    const error = "Failed to capture screenshot";
    console.error(` ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error]
    };
  }
    const perceptionResult = await callPerceptionApi(screenshot);
  
  if (!perceptionResult.success) {
    const error = `Perception failed: ${perceptionResult.error}`;
    console.error(` ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error]
    };
  }
   console.log(`Successfully detected ${perceptionResult.elements.length} UI elements`);
  return {
    perception_result: perceptionResult,
    status: "running"
  };
}


async function gridBasedPerception(state: AgentState): Promise<Partial<AgentState>> {
  const targetRegions = selectTargetRegions(state);
  console.log(`Analyzing regions: ${targetRegions.join(', ')}`);
  
  const captureResult = await captureMultipleRegions(
    targetRegions,
    GRID_CONFIG.rows,
    GRID_CONFIG.cols
  );

  if (!captureResult) {
    const error = "Failed to capture multi-region screenshot";
    console.error(` ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error]
    };
  }
  const { screenshot, regionBounds } = captureResult;
  const perceptionResult = await callPerceptionApi(screenshot);
  if (!perceptionResult.success) {
    const error = `Perception failed: ${perceptionResult.error}`;
    console.error(` ${error}`);
    return {
      status: "failed",
      last_error: error,
      errors: [...state.errors, error]
    };
  }
  
  console.log(`Found ${perceptionResult.elements.length} elements in combined region`);
    const transformedElements = perceptionResult.elements.map(el => ({
    ...el,
    bbox: multiRegionCoordsToScreen(el.bbox, regionBounds)
  }));
  
  console.log(` Transformed ${transformedElements.length} elements to screen coordinates`);
  
  return {
    perception_result: {
      elements: transformedElements,
      screenshot: screenshot,
      success: true
    },
    status: "running"
  };
}

function selectTargetRegions(state: AgentState): number[] {
  // Strategy 1: If we have previous action results, focus on nearby regions
  if (state.action_results && state.action_results.length > 0) {
    if (state.action_plan?.actions && state.action_plan.actions.length > 0) {
      const lastPlannedAction = state.action_plan.actions[state.action_plan.actions.length - 1];
      
      if (lastPlannedAction.target?.bbox) {
        const targetRegion = bboxToRegionIndex(
          lastPlannedAction.target.bbox,
          GRID_CONFIG.rows,
          GRID_CONFIG.cols
        );
        
        console.log(` Focusing on region ${targetRegion} and neighbors (from last action)`);
        return getRegionWithNeighbors(targetRegion, GRID_CONFIG.rows, GRID_CONFIG.cols);
      }
    }
  }

  // Strategy 2: First iteration after full screen - analyze center regions
  if (state.iteration_count === 1) {
    console.log(" First iteration - analyzing center regions");
    return getCenterRegions(GRID_CONFIG.rows, GRID_CONFIG.cols);
  }

  //  analyze all regions fallback
  console.log(" Fallback - analyzing all regions");
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
    centerRow * cols + centerCol
  ].filter(idx => idx >= 0 && idx < rows * cols);
}
