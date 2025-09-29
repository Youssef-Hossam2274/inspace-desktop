// src/services/llmApi.ts

import Instructor from "@instructor-ai/instructor";
import Groq from "groq-sdk";
import { z } from "zod";
import { ActionPlan, UIElement, ActionResult } from "../agent/types";

// ============================================================================
// Configuration
// ============================================================================

const LLM_API_CONFIG = {
  provider: process.env.LLM_PROVIDER || "groq",
  apiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY,
  model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  timeout: 60000,
  maxRetries: 3,
  maxElements: 50 // Reduced from 100 for better context
};

// ============================================================================
// Zod Schema for Validation
// ============================================================================

const ActionSchema = z.object({
  step_id: z.number(),
  action_type: z.enum(["click", "type", "scroll", "wait", "screenshot"]),
  description: z.string(),
  target: z.object({
    bbox: z.array(z.number()).length(4),
    content: z.string(),
    type: z.string()
  }).optional(),
  parameters: z.object({
    text: z.string().optional(),
    clear_first: z.boolean().optional(),
    direction: z.enum(["up", "down", "left", "right"]).optional(),
    amount: z.number().optional(),
    duration: z.number().optional()
  }).optional(),
  verify_immediately: z.boolean().optional(),
  expected_outcome: z.object({
    verification_type: z.enum(["element_appears", "text_present"]),
    expected_content: z.array(z.string())
  }).optional()
});

const ActionPlanSchema = z.object({
  test_id: z.string(),
  current_step: z.number(),
  status: z.enum(["in_progress", "completed", "failed"]),
  actions: z.array(ActionSchema),
  batch_verification: z.object({
    after_step: z.number(),
    success_criteria: z.array(z.object({
      type: z.enum(["text_present", "element_visible"]),
      content: z.string()
    }))
  }).optional(),
  next_action: z.enum(["continue", "complete", "pause"]),
  context: z.object({
    test_data: z.object({
      initial_prompt: z.string(),
      previous_reasoning: z.string()
    })
  }).optional(),
  error_handling: z.object({
    on_element_not_found: z.enum(["take_screenshot", "retry"]),
    on_timeout: z.enum(["retry", "fail"])
  }).optional()
});

// ============================================================================
// Types
// ============================================================================

interface LLMContext {
  user_prompt: string;
  current_elements: UIElement[];
  iteration_count: number;
  previous_actions: ActionResult[];
  test_id: string;
}

// ============================================================================
// Element Filtering & Prioritization
// ============================================================================

class ElementFilter {
  private static readonly INTERACTIVE_TYPES = [
    'button', 'input', 'link', 'textarea', 'select', 'checkbox', 'radio'
  ];
  
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
  ]);

  static filterAndPrioritize(
    elements: UIElement[],
    userPrompt: string,
    previousActions: ActionResult[],
    maxElements: number = LLM_API_CONFIG.maxElements
  ): UIElement[] {
    console.log(`[ElementFilter] Filtering ${elements.length} elements...`);

    // Extract keywords from prompt
    const keywords = this.extractKeywords(userPrompt);
    console.log(`[ElementFilter] Keywords: ${keywords.join(', ')}`);

    // Score and sort elements
    const scoredElements = elements.map(el => ({
      element: el,
      score: this.calculateRelevanceScore(el, keywords, previousActions)
    }));

    // Sort by score (descending)
    scoredElements.sort((a, b) => b.score - a.score);

    // Take top N elements
    const filtered = scoredElements
      .slice(0, maxElements)
      .map(se => se.element);

    console.log(`[ElementFilter] Filtered to ${filtered.length} most relevant elements`);
    
    return filtered;
  }

  private static extractKeywords(prompt: string): string[] {
    return prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.STOP_WORDS.has(word));
  }

  private static calculateRelevanceScore(
    element: UIElement,
    keywords: string[],
    previousActions: ActionResult[]
  ): number {
    let score = 0;

    // Priority 1: Interactive elements (highest weight)
    if (this.isInteractive(element)) {
      score += 100;
    }

    // Priority 2: Content matches keywords
    const content = element.content.toLowerCase();
    const matchingKeywords = keywords.filter(kw => content.includes(kw));
    score += matchingKeywords.length * 50;

    // Priority 3: Element type matches keywords
    const type = element.type.toLowerCase();
    const typeMatches = keywords.filter(kw => type.includes(kw));
    score += typeMatches.length * 30;

    // Priority 4: Near previously interacted elements
    if (this.isNearPreviousAction(element, previousActions)) {
      score += 20;
    }

    // Priority 5: Has meaningful content (not empty or too generic)
    if (element.content.trim().length > 0 && element.content.length < 100) {
      score += 10;
    }

    // Penalty for very long content (likely not actionable)
    if (element.content.length > 200) {
      score -= 20;
    }

    return score;
  }

  private static isInteractive(element: UIElement): boolean {
    // First check the explicit interactivity flag from perception API
    if (element.interactivity === true) {
      return true;
    }
    
    // Fallback: Check if type suggests interactivity
    const type = element.type.toLowerCase();
    return this.INTERACTIVE_TYPES.some(t => type.includes(t));
  }

  private static isNearPreviousAction(
    element: UIElement,
    previousActions: ActionResult[]
  ): boolean {
    if (previousActions.length === 0) return false;

    const threshold = 0.1; // 10% of screen distance
    const lastAction = previousActions[previousActions.length - 1];
    
    if (!lastAction.action?.target?.bbox) return false;

    const [x1, y1] = element.bbox;
    const [px1, py1] = lastAction.action.target.bbox;

    const distance = Math.sqrt(
      Math.pow(x1 - px1, 2) + Math.pow(y1 - py1, 2)
    );

    return distance < threshold;
  }
}

// ============================================================================
// Prompt Builder
// ============================================================================

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
- Use normalized coordinates (0-1) for bounding boxes
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

// ============================================================================
// Legacy Support (Fallback without Instructor)
// ============================================================================

export async function callLLMApiFallback(context: LLMContext): Promise<ActionPlan | null> {
  console.log(`[LLMAPI] Using fallback mode (without Instructor validation)`);
  
  try {
    const filteredElements = ElementFilter.filterAndPrioritize(
      context.current_elements,
      context.user_prompt,
      context.previous_actions
    );

    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = PromptBuilder.buildUserPrompt(context, filteredElements);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_API_CONFIG.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(LLM_API_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from Groq");
    }

    const actionPlan = JSON.parse(content) as ActionPlan;
    return new LLMClient().ensureRequiredFields(actionPlan, context);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[LLMAPI] Error in fallback mode: ${errorMsg}`);
    return null;
  }
}