import { z } from "zod";

// Action types enum
const ActionTypeEnum = z.enum([
  "click",
  "double_click",
  "right_click",
  "move_mouse",
  "type",
  "key_press",
  "key_combo",
  "clear_input",
  "scroll",
  "hover",
  "copy",
  "paste",
  "assert_text",
  "screenshot",
  "wait",
  "drag_and_drop",
  "custom_action",
]);

const TargetSchema = z.object({
  elementId: z
    .string()
    .optional()
    .describe("Element ID from the provided UI elements list"),
  bbox: z
    .array(z.number())
    .length(4)
    .optional()
    .describe("Bounding box coordinates [x1, y1, x2, y2]"),
  content: z.string().optional().describe("Element content for reference"),
  type: z.string().optional().describe("Element type for reference"),
  region: z.string().optional().describe("Screen region description"),
});

// Parameters schema - includes all possible action parameters
const ParametersSchema = z
  .object({
    // Type action
    text: z.string().optional().describe("Text to type"),
    clear_first: z.boolean().optional().describe("Clear input before typing"),

    // Scroll action
    direction: z
      .enum(["up", "down", "left", "right"])
      .optional()
      .describe("Scroll direction"),
    amount: z.number().optional().describe("Scroll amount in pixels"),

    // Wait action
    duration: z.number().optional().describe("Wait duration in milliseconds"),

    // Key press action
    key: z
      .string()
      .optional()
      .describe("Single key to press (e.g., 'Enter', 'Escape')"),

    // Key combo action
    keys: z
      .array(z.string())
      .optional()
      .describe("Array of keys for combination (e.g., ['Control', 'c'])"),

    // Assert text action
    expected_text: z
      .string()
      .optional()
      .describe("Expected text for assertion"),

    // Drag and drop action
    from_elementId: z
      .string()
      .optional()
      .describe("Source element ID for drag"),
    to_elementId: z.string().optional().describe("Target element ID for drop"),
    from_bbox: z
      .array(z.number())
      .length(4)
      .optional()
      .describe("Resolved source bbox"),
    to_bbox: z
      .array(z.number())
      .length(4)
      .optional()
      .describe("Resolved target bbox"),

    // Custom action
    actions: z
      .array(z.record(z.any()))
      .optional()
      .describe("Array of custom action objects"),
  })
  .optional();

// Expected outcome schema
const ExpectedOutcomeSchema = z
  .object({
    verification_type: z.string().describe("Type of verification to perform"),
    expected_content: z
      .array(z.string())
      .describe("Expected content or elements"),
  })
  .optional();

// Action step schema
const ActionStepSchema = z.object({
  step_id: z.number().describe("Sequential step identifier"),
  action_type: ActionTypeEnum.describe("Type of action to perform"),
  description: z.string().describe("Human-readable description of the action"),
  target: TargetSchema.optional().describe("Target element for the action"),
  parameters: ParametersSchema.optional(),
  verify_immediately: z
    .boolean()
    .optional()
    .describe("Whether to verify this action immediately"),
  expected_outcome: ExpectedOutcomeSchema,
});

// Batch verification schema
const BatchVerificationSchema = z
  .object({
    after_step: z
      .number()
      .describe("Perform batch verification after this step"),
    success_criteria: z
      .array(
        z.object({
          type: z
            .enum(["text_present", "element_visible", "element_not_visible"])
            .describe("Type of verification"),
          content: z.string().describe("Content to verify"),
        })
      )
      .describe("Criteria that must all pass for success"),
  })
  .optional();

// Context schema
const ContextSchema = z.object({
  test_data: z.object({
    initial_prompt: z.string().describe("Original user goal"),
    previous_reasoning: z
      .string()
      .optional()
      .describe("Summary of previous actions"),
  }),
});

// Error handling schema
const ErrorHandlingSchema = z.object({
  on_element_not_found: z
    .string()
    .describe(
      "Strategy when element not found: take_screenshot, retry, or fail"
    ),
  on_timeout: z.string().describe("Strategy on timeout: retry or fail"),
});

// Main ActionPlan schema
export const ActionPlanSchema = z.object({
  test_id: z.string().describe("Unique test identifier"),
  current_step: z.number().describe("Current step number in the test"),
  status: z
    .enum(["in_progress", "completed", "failed"])
    .describe("Current status of the test"),
  actions: z
    .array(ActionStepSchema)
    .describe("Array of sequential actions to perform"),
  batch_verification: BatchVerificationSchema.optional(),
  next_action: z
    .enum(["continue", "complete", "pause", "retry"])
    .describe("What to do after this action plan"),
  context: ContextSchema.describe("Context and metadata for the test"),
  error_handling: ErrorHandlingSchema.describe("Error handling strategies"),
});

// Type export for TypeScript usage
export type ActionPlanType = z.infer<typeof ActionPlanSchema>;

export function validateActionPlan(data: unknown): ActionPlanType {
  return ActionPlanSchema.parse(data);
}

export function safeValidateActionPlan(data: unknown): {
  success: boolean;
  data?: ActionPlanType;
  errors?: z.ZodError;
} {
  const result = ActionPlanSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
