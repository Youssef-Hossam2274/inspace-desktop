import { z } from "zod";

export const ActionSchema = z.object({
  step_id: z.number(),
  action_type: z.enum(["click", "type", "scroll", "wait", "screenshot"]),
  description: z.string(),
  target: z
    .object({
      bbox: z.array(z.number()).length(4),
      content: z.string(),
      type: z.string(),
    })
    .optional(),
  parameters: z
    .object({
      text: z.string().optional(),
      clear_first: z.boolean().optional(),
      direction: z.enum(["up", "down", "left", "right"]).optional(),
      amount: z.number().optional(),
      duration: z.number().optional(),
    })
    .optional(),
  verify_immediately: z.boolean().optional(),
  expected_outcome: z
    .object({
      verification_type: z.enum(["element_appears", "text_present"]),
      expected_content: z.array(z.string()),
    })
    .optional(),
});

export const ActionPlanSchema = z.object({
  test_id: z.string(),
  current_step: z.number(),
  status: z.enum(["in_progress", "completed", "failed"]),
  actions: z.array(ActionSchema),
  batch_verification: z
    .object({
      after_step: z.number(),
      success_criteria: z.array(
        z.object({
          type: z.enum(["text_present", "element_visible"]),
          content: z.string(),
        })
      ),
    })
    .optional(),
  next_action: z.enum(["continue", "complete", "pause"]),
  context: z
    .object({
      test_data: z.object({
        initial_prompt: z.string(),
        previous_reasoning: z.string(),
      }),
    })
    .optional(),
  error_handling: z
    .object({
      on_element_not_found: z.enum(["take_screenshot", "retry"]),
      on_timeout: z.enum(["retry", "fail"]),
    })
    .optional(),
});
