import {ActionPlan} from "../../agent/types";
import {ElementFilter} from "./ElementFilter"
import {LLMContext} from "../../agent/types"
import {PromptBuilder} from "./PromptBuilder"
import {LLMClient} from "./LLMClient"

export async function callLLMApi(context: LLMContext): Promise<ActionPlan | null> {
  console.log(`[LLMAPI] Generating action plan for prompt: "${context.user_prompt}"`);
  
  try {
    const filteredElements = ElementFilter.filterAndPrioritize(
      context.current_elements,
      context.user_prompt,
      context.previous_actions
    );

    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = PromptBuilder.buildUserPrompt(context, filteredElements);

    const llmClient = new LLMClient();
    const actionPlan = await llmClient.generateActionPlan(
      systemPrompt,
      userPrompt,
      context
    );

    console.log(`[LLMAPI] Generated validated action plan with ${actionPlan.actions.length} actions`);
    console.log(actionPlan);
    return actionPlan;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[LLMAPI] Error calling LLM API: ${errorMsg}`);
    return null;
  }
}
