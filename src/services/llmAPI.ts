// src/services/llmApi.ts

import Instructor from "@instructor-ai/instructor";
import Groq from "groq-sdk";
import { ActionPlan, UIElement, ActionResult } from "../agent/types";
import {LLM_API_CONFIG} from "../config/LLMConfig.ts"
import { ActionPlanSchema, ActionSchema } from "../config/ActionSchema.ts";
import {ElementFilter} from "./ElementFilter.ts"
import {LLMContext} from "../agent/types.ts"


class PromptBuilder {
  static buildSystemPrompt(): string {
    return `You are a UI automation agent that generates action plans for testing user interfaces.

Your task is to analyze the current UI state and generate a structured action plan in JSON format to accomplish the user's goal.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after - JUST the JSON object.

The JSON schema for ActionPlan is:
{
  "test_id": "string",
  "current_step": "number", 
  "status": "in_progress" | "completed" | "failed",
  "actions": [
    {
      "step_id": "number",
      "action_type": "click" | "type" | "scroll" | "wait" | "screenshot",
      "description": "string",
      "target": {
        "bbox": [x1, y1, x2, y2],
        "content": "string",
        "type": "string"
      },
      "parameters": {
        "text": "string",
        "clear_first": boolean,
        "direction": "up" | "down" | "left" | "right",
        "amount": number,
        "duration": number
      },
      "verify_immediately": boolean,
      "expected_outcome": {
        "verification_type": "element_appears" | "text_present",
        "expected_content": ["string"]
      }
    }
  ],
  "batch_verification": {
    "after_step": number,
    "success_criteria": [
      {
        "type": "text_present" | "element_visible",
        "content": "string"
      }
    ]
  },
  "next_action": "continue" | "complete" | "pause",
  "context": {
    "test_data": {
      "initial_prompt": "string",
      "previous_reasoning": "string"
    }
  },
  "error_handling": {
    "on_element_not_found": "take_screenshot" | "retry",
    "on_timeout": "retry" | "fail"
  }
}

Guidelines:
- Elements are pre-filtered and prioritized by relevance
- Use normalized coordinates (0-1) for bounding boxes as is
- Keep actions atomic and specific
- Set next_action to "complete" when the user's goal is achieved
- Set next_action to "continue" if more iterations are needed
- Match UI elements by their exact content string from the available elements list`;
  }

  static buildUserPrompt(context: LLMContext, filteredElements: UIElement[]): string {
    const elementsDescription = filteredElements
      .map((el, i) => {
        const content = el.content.length > 50 
          ? el.content.substring(0, 47) + '...' 
          : el.content;
        const bbox = `[${el.bbox.map(n => n.toFixed(2)).join(',')}]`;
        return `${i}:${el.type}:"${content}"@${bbox}`;
      })
      .join('\n');
    
    const previousActionsDescription = this.buildActionsHistory(context.previous_actions);
    
    return `User Goal: ${context.user_prompt}

Current UI State (iteration ${context.iteration_count}):
Top ${filteredElements.length} most relevant UI elements (prioritized: interactive > keyword-match > context):
${elementsDescription}
${previousActionsDescription}

Generate an action plan to accomplish the user's goal. Respond with ONLY the JSON object, no other text.`;
  }

  private static buildActionsHistory(actions: ActionResult[]): string {
    if (actions.length === 0) return '';

    const recentActions = actions.slice(-5); // Last 5 actions
    const successCount = actions.filter(a => a.success).length;
    
    const summary = `\nCompleted ${successCount}/${actions.length} actions. Recent: ${
      recentActions.map(a => `${a.step_id}:${a.success ? '✓' : '✗'}`).join(', ')
    }`;

    return summary;
  }
}

// ============================================================================
// LLM Client
// ============================================================================

class LLMClient {
  private client: ReturnType<typeof Instructor>;
  private groq: Groq;

  constructor() {
    if (!LLM_API_CONFIG.apiKey) {
      throw new Error("Groq API key not configured. Set LLM_API_KEY or GROQ_API_KEY environment variable");
    }

    this.groq = new Groq({ apiKey: LLM_API_CONFIG.apiKey });
    this.client = Instructor({
      client: this.groq,
      mode: "TOOLS"
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
        { role: "user", content: userPrompt }
      ],
      model: LLM_API_CONFIG.model,
      temperature: 0.1,
      response_model: {
        schema: ActionPlanSchema,
        name: "ActionPlan"
      },
      max_retries: LLM_API_CONFIG.maxRetries
    });

    // Ensure required fields are present (fallbacks)
    return this.ensureRequiredFields(actionPlan as ActionPlan, context);
  }

  private ensureRequiredFields(plan: ActionPlan, context: LLMContext): ActionPlan {
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
        on_timeout: "retry"
      };
    }

    // Ensure context
    if (!plan.context) {
      plan.context = {
        test_data: {
          initial_prompt: context.user_prompt,
          previous_reasoning: `Iteration ${context.iteration_count}`
        }
      };
    }

    return plan;
  }
}

// ============================================================================
// Main API Function
// ============================================================================

export async function callLLMApi(context: LLMContext): Promise<ActionPlan | null> {
  console.log(`[LLMAPI] Generating action plan for prompt: "${context.user_prompt}"`);
  
  try {
    // Step 1: Filter and prioritize elements
    const filteredElements = ElementFilter.filterAndPrioritize(
      context.current_elements,
      context.user_prompt,
      context.previous_actions
    );

    // Step 2: Build prompts
    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = PromptBuilder.buildUserPrompt(context, filteredElements);

    // Step 3: Call LLM with validation
    const llmClient = new LLMClient();
    const actionPlan = await llmClient.generateActionPlan(
      systemPrompt,
      userPrompt,
      context
    );

    console.log(`[LLMAPI] ✓ Generated validated action plan with ${actionPlan.actions.length} actions`);
    return actionPlan;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[LLMAPI] ✗ Error calling LLM API: ${errorMsg}`);
    return null;
  }
}
