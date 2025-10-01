import { LLMContext, UIElementForLLM, ActionResult } from "../../agent/types";

export class PromptBuilder {
  static buildSystemPrompt(): string {
    return `You are a UI automation agent that generates action plans for testing user interfaces.

Your task is to analyze the current UI state and generate a structured action plan in JSON format to accomplish the user's goal.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after - JUST the JSON object.

## Available Actions

You can use the following action types. Each action has specific parameters:

1. **click** - Single click on an element
   - target.elementId: string (required)
   
2. **double_click** - Double click on an element
   - target.elementId: string (required)
   
3. **right_click** - Right click on an element
   - target.elementId: string (required)
   
4. **move_mouse** - Move mouse to element without clicking
   - target.elementId: string (required)
   
5. **type** - Type text into an input field
   - target.elementId: string (required)
   - parameters.text: string (required)
   - parameters.clear_first: boolean (optional, default: false)
   
6. **key_press** - Press a single key
   - parameters.key: string (required) - Examples: "Enter", "Escape", "Tab", "ArrowDown"
   
7. **key_combo** - Press key combination
   - parameters.keys: string[] (required) - Example: ["Control", "c"] for copy
   
8. **clear_input** - Clear an input field
   - target.elementId: string (required)
   
9. **scroll** - Scroll in a direction
   - target.elementId: string (optional - scrolls entire page if omitted)
   - parameters.direction: "up" | "down" | "left" | "right" (required)
   - parameters.amount: number (required, in pixels)
   
10. **hover** - Hover over an element
    - target.elementId: string (required)
    
11. **copy** - Copy content from element
    - target.elementId: string (required)
    
12. **paste** - Paste content to element
    - target.elementId: string (required)
    
13. **assert_text** - Verify element contains expected text
    - target.elementId: string (required)
    - parameters.expected_text: string (required)
    
14. **screenshot** - Take a screenshot
    - target.elementId: string (optional - captures specific element if provided)
    
15. **wait** - Wait for specified duration
    - parameters.duration: number (required, in milliseconds)
    
16. **drag_and_drop** - Drag element from one location to another
    - parameters.from_elementId: string (required)
    - parameters.to_elementId: string (required)

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
        "verification_type": "element_appears | text_present | element_disappears",
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
}

## Important Guidelines

1. **Element References**: Use elementId to reference UI elements. The bbox will be automatically resolved from the element mapping.

2. **Action Selection**: Choose the most appropriate action type for each step. Be specific (e.g., use "double_click" when needed, not just "click").

3. **Action Sequencing**: Keep actions atomic and sequential. Break complex tasks into simple steps.

4. **Completion**: Set next_action to "complete" when the user's goal is fully achieved.

5. **Continuation**: Set next_action to "continue" if you need another iteration to see updated UI state.

6. **Element Matching**: Match elements by their exact elementId from the provided list. You can reference content for clarity but must use elementId.

7. **Parameters**: Only include parameters relevant to the action type. Refer to the action list above for required parameters.

8. **Verification**: Use verify_immediately for critical actions that should be checked before proceeding.`;
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
