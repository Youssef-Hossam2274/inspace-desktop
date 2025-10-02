import { LLMContext, UIElementForLLM, ActionResult } from "../../agent/types";

export class PromptBuilder {
  static buildSystemPrompt(): string {
    return `You are a UI automation agent that generates action plans for testing user interfaces and usecases.

Your task is to analyze the current UI state and generate a structured action plan in JSON format to accomplish the user's goal.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after - JUST the JSON object.
IMPORTANT: You work in ITERATIONS. Each iteration:
1. Takes a screenshot of current state
2. You generate actions for THIS iteration only
3. Actions are executed
4. System verifies if iteration succeeded
5. If successful, NEXT iteration starts with NEW screenshot

CRITICAL GUIDELINES:
1. Generate finite actions per iteration for a single logical step (e.g., "fill login form")
2. ALWAYS add wait action after interactions that trigger UI changes (e.g., after clicking submit)
3. Use batch_verification to define what should be visible/present after this iteration
4. Set next_action to "complete" ONLY if the entire user goal is accomplished
5. Set next_action to "continue" if more iterations are needed
6. always use atomic actions and use as many steps as you want.

Available Actions (all require target.elementId unless noted):
- click, double_click, right_click, move_mouse, hover
- type (+ parameters.text, clear_first)
- key_press (parameters.key, no target) | key_combo (parameters.keys, no target)
- wait (parameters.duration, no target)
- scroll (optional target, + parameters.direction, amount)
- clear_input, copy, paste
- screenshot (optional target)

JSON Schema:
{
  "test_id": "string",
  "current_step": 0,
  "status": "in_progress" | "completed",
  "actions": [
    {
      "step_id": "number",
      "action_type": "click" | "type" | "wait" | etc,
      "description": "Clear description of what this does",
      "target": {
        "elementId": "elem_X_Y from provided list"
      },
      "parameters": {
        "text": "for type actions",
        "clear_first": true/false,
        "duration": 2000,
        "key": "Enter",
        "keys": ["Control", "c"]
      }
    }
  ],
  "batch_verification": {
    "after_step": "last step number",
    "success_criteria": [
      {
        "type": "text_present" | "element_visible" | "element_not_visible",
        "content": "what to verify"
      }
    ]
  },
  "next_action": "continue" | "complete",
  "context": {
    "test_data": {
      "initial_prompt": "user goal",
      "previous_reasoning": "what was done so far"
    }
  },
  "error_handling": {
    "on_element_not_found": "retry",
    "on_timeout": "retry"
  }
}`;
  }

  static buildUserPrompt(
    context: LLMContext,
    filteredElements: UIElementForLLM[]
  ): string {
    const elementsDescription = filteredElements
      .map((el) => {
        const content =
          el.content.length > 60
            ? el.content.substring(0, 57) + "..."
            : el.content;
        const interactive = el.interactivity ? "[interactive]" : "";
        return `${el.elementId}: ${el.type} ${interactive} "${content}"`;
      })
      .join("\n");

    const iterationContext = this.buildIterationContext(context);
    const previousActionsDescription = this.buildActionsHistory(
      context.previous_actions
    );
    return `User Goal: ${context.user_prompt}

${iterationContext}

Current UI State (Iteration ${context.iteration_count}):
${elementsDescription}

${previousActionsDescription}

Respond with ONLY valid JSON, no other text.`;
  }
  private static buildIterationContext(context: LLMContext): string {
    if (context.iteration_count === 0) {
      return "This is ITERATION 0 (first iteration). Analyze the UI and take the first logical step.";
    }

    const actionCount = context.previous_actions.length;
    const successCount = context.previous_actions.filter(
      (a) => a.success
    ).length;

    return `This is ITERATION ${context.iteration_count}.
Previous iterations completed ${successCount}/${actionCount} actions successfully.
The elements above shows the CURRENT state after previous actions.
Analyze what changed and decide the next logical step.`;
  }

  private static buildActionsHistory(actions: ActionResult[]): string {
    if (actions.length === 0) {
      return "No previous actions yet.";
    }

    const recentActions = actions.slice(-8);
    const summary = recentActions
      .map((a) => {
        const status = a.success ? "✓" : "✗";
        const error = a.error ? ` (${a.error})` : "";
        return `  Step ${a.step_id}: ${status}${error}`;
      })
      .join("\n");

    return `Previous Actions (last ${recentActions.length}):\n${summary}`;
  }
}
