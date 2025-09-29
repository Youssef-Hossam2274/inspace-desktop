import { AgentState, Screenshot, PerceptionResult } from "../types";
import { captureScreenshot } from "../../services/screenshotService";
import { callPerceptionApi } from "../../services/perceptionAPI";

export async function perceptionNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`[Perception] Starting perception node - Iteration ${state.iteration_count}`);
  
  try {
    // Capture screenshot
    console.log("[Perception] Capturing screenshot...");
    const screenshot = await captureScreenshot();
    
    if (!screenshot) {
      const error = "Failed to capture screenshot";
      console.error(`[Perception] ${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error]
      };
    }
    
    console.log(`[Perception] Screenshot captured: ${screenshot.dimensions.width}x${screenshot.dimensions.height}`);
    
    //  Send to Omniparser for UI element detection
    console.log("[Perception] Sending to Omniparser...");
    const perceptionResult = await callPerceptionApi(screenshot);
    
    if (!perceptionResult.success) {
      const error = `Perception failed: ${perceptionResult.error}`;
      console.error(`[Perception] ${error}`);
      return {
        status: "failed",
        last_error: error,
        errors: [...state.errors, error]
      };
    }
    
    console.log(`[Perception] Successfully detected ${perceptionResult.elements.length} UI elements`);
    
    // Log detected elements for debugging
    perceptionResult.elements.forEach((element, index) => {
      console.log(`[Perception] Element ${index}: ${element.type} - "${element.content}" at [${element.bbox.join(', ')}]`);
    });
    
    return {
      current_screenshot: screenshot,
      perception_result: perceptionResult,
      status: "running" // Keep running
    };
    
  } catch (error) {
    const errorMsg = `Perception node error: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Perception] ${errorMsg}`);
    
    return {
      status: "failed",
      last_error: errorMsg,
      errors: [...state.errors, errorMsg]
    };
  }
}