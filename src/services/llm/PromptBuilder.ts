import { LLMContext, UIElement, ActionResult } from "../../agent/types"
export class PromptBuilder {
  static buildSystemPrompt(): string {
    return `You are a UI automation agent that generates action plans for testing user interfaces.

Your task is to analyze the current UI state and generate a structured action plan in JSON format to accomplish the user's goal.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after - JUST the JSON object.
Based on the provided prompt, and bboxes list, generate a detailed action plan in JSON format to accomplish the user's goal.
It must be fully detailed for every small action based on what the screen is showing right now.
The JSON schema for ActionPlan is:
{
  "test_id": "string",
  "current_step": "number", 
  "status": "in_progress" | "completed" | "failed",
  "actions": [
    {ّ
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
