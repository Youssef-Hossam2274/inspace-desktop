import { LLM_API_CONFIG } from "../../config/LLMConfig.js";
import { ActionPlanSchema } from "../../config/ActionSchema.js";
import Instructor from "@instructor-ai/instructor";
import Groq from "groq-sdk";
import { ActionPlan } from "../../agent/types";
import { LLMContext } from "../../agent/types";

export class LLMClient {
  private client: ReturnType<typeof Instructor>;
  private groq: Groq;

  constructor() {
    if (!LLM_API_CONFIG.apiKey) {
      throw new Error(
        "Groq API key not configured. Set LLM_API_KEY or GROQ_API_KEY environment variable"
      );
    }

    this.groq = new Groq({ apiKey: LLM_API_CONFIG.apiKey });
    this.client = Instructor({
      client: this.groq,
      mode: "TOOLS",
    });
  }

  async generateActionPlan(
    systemPrompt: string,
    userPrompt: string,
    context: LLMContext
  ): Promise<ActionPlan> {
    console.log(`[LLMClient] Calling Groq with model: ${LLM_API_CONFIG.model}`);

    const actionPlan = await this.client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: LLM_API_CONFIG.model,
      temperature: 0.1,
      response_model: {
        schema: ActionPlanSchema,
        name: "ActionPlan",
      },
      max_retries: LLM_API_CONFIG.maxRetries,
    });

    // Ensure required fields are present (fallbacks)
    return this.ensureRequiredFields(actionPlan as ActionPlan, context);
  }

  private ensureRequiredFields(
    plan: ActionPlan,
    context: LLMContext
  ): ActionPlan {
    plan.test_id = plan.test_id || context.test_id;
    plan.current_step = plan.current_step || context.iteration_count + 1;
    plan.status = plan.status || "in_progress";

    // Ensure sequential step_ids
    plan.actions.forEach((action, index) => {
      if (!action.step_id) {
        action.step_id = index + 1;
      }
    });

    // Ensure error handling
    if (!plan.error_handling) {
      plan.error_handling = {
        on_element_not_found: "take_screenshot",
        on_timeout: "retry",
      };
    }

    // Ensure context
    if (!plan.context) {
      plan.context = {
        test_data: {
          initial_prompt: context.user_prompt,
          previous_reasoning: `Iteration ${context.iteration_count}`,
        },
      };
    }

    return plan;
  }
}
