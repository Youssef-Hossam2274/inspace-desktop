import { LLMContext, UIElementForLLM, ActionResult } from "../../agent/types";

export class PromptBuilder {
  static buildSystemPrompt(): string {
    return `You are a UI automation agent that generates action plans for testing user interfaces and usecases.

Your task is to analyze the current UI state and generate a structured action plan in JSON format to accomplish the user's goal.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after - JUST the JSON object.

Available Actions (all require target.elementId unless noted):
- click, double_click, right_click, move_mouse, hover
- type (+ parameters.text, clear_first)
- key_press (parameters.key, no target) | key_combo (parameters.keys, no target)
- wait (parameters.duration, no target)
- scroll (optional target, + parameters.direction, amount)
- clear_input, copy, paste
- assert_text (+ parameters.expected_text)
- drag_and_drop (parameters.from_elementId, to_elementId, no target)
- screenshot (optional target)

## JSON Schema for ActionPlan

{
  "test_id": "string",
  "current_step": "number", 
  "status": "in_progress" | "completed" | "failed",
  "actions": [
    {
      "step_id": "number",
      "action_type": "click" | "double_click" | "right_click" | "move_mouse" | "type" | "key_press" | "key_combo" | "clear_input" | "scroll" | "hover" | "copy" | "paste" | "assert_text" | "screenshot" | "wait" | "drag_and_drop",
      "description": "string - Human readable description of what this action does",
      "target": {
        "elementId": "string - Reference to element from the provided list",
      },
      "parameters": {
        "text": "string - For type action",
        "clear_first": "boolean - For type action",
        "direction": "up | down | left | right - For scroll action",
        "amount": "number - For scroll action (pixels)",
        "duration": "number - For wait action (milliseconds)",
        "key": "string - For key_press action",
        "keys": "string[] - For key_combo action",
        "expected_text": "string - For assert_text action",
        "from_elementId": "string - For drag_and_drop action",
        "to_elementId": "string - For drag_and_drop action"
      },
      "verify_immediately": "boolean - Whether to verify this action's result",
      "expected_outcome": {
        "verification_type": "element_visible | text_present | element_not_visible",
        "expected_content": ["string array of expected results"]
      }
    }
  ],
  "batch_verification": {
    "after_step": "number - Verify after this step completes",
    "success_criteria": [
      {
        "type": "text_present | element_visible | element_not_visible",
        "content": "string - What to verify"
      }
    ]
  },
  "next_action": "continue | complete | pause",
  "context": {
    "test_data": {
      "initial_prompt": "string - Original user goal",
      "previous_reasoning": "string - Brief summary of what was accomplished"
    }
  },
  "error_handling": {
    "on_element_not_found": "take_screenshot | retry | fail",
    "on_timeout": "retry | fail"
  }
}`;
  }

  static buildUserPrompt(
    context: LLMContext,
    filteredElements: UIElementForLLM[]
  ): string {
    const elementsDescription = filteredElements
      .map((el, i) => {
        const content =
          el.content.length > 60
            ? el.content.substring(0, 57) + "..."
            : el.content;
        const interactive = el.interactivity ? "[interactive]" : "";
        return `${el.elementId}: ${el.type} ${interactive} "${content}"`;
      })
      .join("\n");

    const previousActionsDescription = this.buildActionsHistory(
      context.previous_actions
    );

    return `User Goal: ${context.user_prompt}

Current UI State (iteration ${context.iteration_count}):
Available UI Elements (${filteredElements.length} most relevant, pre-filtered by interactivity and keyword relevance):

${elementsDescription}
${previousActionsDescription}

Generate an action plan to accomplish the user's goal. 
- Reference elements using their elementId (e.g., "elem_0_5")
- Choose appropriate action types from the available list
- Include all required parameters for each action type
- Be specific and atomic in your actions

Respond with ONLY the JSON object, no other text.`;
  }

  private static buildActionsHistory(actions: ActionResult[]): string {
    if (actions.length === 0) return "\n(No previous actions yet)";

    const recentActions = actions.slice(-5);
    const successCount = actions.filter((a) => a.success).length;

    const summary = `\nPrevious Actions Summary: ${successCount}/${actions.length} successful
Recent: ${recentActions
      .map(
        (a) =>
          `Step ${a.step_id}: ${a.success ? "✓" : "✗"}${a.error ? ` (${a.error})` : ""}`
      )
      .join(", ")}`;

    return summary;
  }
}
