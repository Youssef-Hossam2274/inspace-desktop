import { ActionPlan } from "../../agent/types";
import { LLMContext } from "../../agent/types";
import { PromptBuilder } from "./PromptBuilder.js";
import { LLMClient } from "./LLMClient.js";

export async function callLLMApi(
  context: LLMContext
): Promise<ActionPlan | null> {
  console.log(`Generating action plan for prompt: "${context.user_prompt}"`);
  console.log(`Context has ${context.current_elements.length} elements`);

  try {
    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = PromptBuilder.buildUserPrompt(
      context,
      context.current_elements
    );

    const systemTokensApprox = Math.ceil(systemPrompt.length / 4);
    const userTokensApprox = Math.ceil(userPrompt.length / 4);
    console.log(
      `Prompt size - System: ~${systemTokensApprox} tokens, User: ~${userTokensApprox} tokens`
    );

    const llmClient = new LLMClient();
    const actionPlan = await llmClient.generateActionPlan(
      systemPrompt,
      userPrompt,
      context
    );

    const referencedIds = new Set<string>();
    actionPlan.actions.forEach((action) => {
      if (action.target?.elementId) {
        referencedIds.add(action.target.elementId);
      }
      if (action.parameters?.from_elementId) {
        referencedIds.add(action.parameters.from_elementId);
      }
      if (action.parameters?.to_elementId) {
        referencedIds.add(action.parameters.to_elementId);
      }
    });

    return actionPlan;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error calling LLM API: ${errorMsg}`);
    return null;
  }
}
