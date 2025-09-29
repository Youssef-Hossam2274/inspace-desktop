import {AgentState, ActionPlan} from "../types";
import {callLLMApi} from "../../services/llm/llmAPI";

export async function reasoningNode(state: AgentState): Promise<Partial<AgentState>>{
    console.log(`[Reasoning] Starting reasoning node - Iteration ${state.iteration_count}`);
    try{
        if (!state.perception_result){
            const error = "No perception result available for reasoning";
            console.error(`[Reasoning] ${error}`);
            return {
                status: "failed",
                last_error: error,
                errors: [...state.errors, error]
            };
        }
        console.log(`[Reasoning] Perception result has ${state.perception_result.elements.length} elements`);
        const context = {
            user_prompt: state.user_prompt,
            current_elements: state.perception_result.elements,
            iteration_count: state.iteration_count,
            previous_actions: state.action_results || [],
            test_id: state.test_id
        };
        console.log("[Reasoning] Sending context to LLM for action plan generation...");
        console.log(`[Reasoning] Available UI elements: ${state.perception_result.elements.length}`);
        const actionPlan = await callLLMApi(context);
        if (!actionPlan) {
            const error = "LLM failed to generate action plan";
            console.error(`[Reasoning] ${error}`);
            return {
                status: "failed",
                last_error: error,
                errors: [...state.errors, error]
            };
        }

        if (!actionPlan.actions || actionPlan.actions.length === 0) {
            const error = "Generated action plan contains no actions";
            console.error(`[Reasoning] ${error}`);
            return {
                status: "failed",
                last_error: error,
                errors: [...state.errors, error]
            };
        }
        console.log(`[Reasoning] Generated action plan with ${actionPlan.actions.length} actions`);
        console.log(`[Reasoning] Next action directive: ${actionPlan.next_action}`);
        actionPlan.actions.forEach((action, index) => {
        console.log(`[Reasoning] Action ${action.step_id}: ${action.action_type} - ${action.description}`);
        });
        
        return {
        action_plan: actionPlan,
        status: "running"
        };
        
    } catch (error) {
        const errorMsg = `Reasoning node error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[Reasoning] ${errorMsg}`);
        
        return {
        status: "failed",
        last_error: errorMsg,
        errors: [...state.errors, errorMsg]
        };
    }
}