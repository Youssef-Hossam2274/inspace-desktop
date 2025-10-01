export interface Screenshot {
  data: string;
  timestamp: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface UIElement {
  elementId: string;
  bbox: [number, number, number, number];
  content: string;
  type: string;
  interactivity: boolean;
  confidence?: number;
}

export interface UIElementForLLM {
  elementId: string;
  content: string;
  type: string;
  interactivity: boolean;
}

export interface PerceptionResult {
  elements: UIElement[];
  screenshot: Screenshot;
  success: boolean;
  error?: string;
}

export type ActionType =
  | "click"
  | "double_click"
  | "right_click"
  | "move_mouse"
  | "type"
  | "key_press"
  | "key_combo"
  | "clear_input"
  | "scroll"
  | "hover"
  | "copy"
  | "paste"
  | "assert_text"
  | "screenshot"
  | "wait"
  | "drag_and_drop"
  | "custom_action";

export interface ActionStep {
  step_id: number;
  action_type: ActionType;
  description: string;
  target: {
    elementId?: string;
    bbox?: [number, number, number, number];
    content?: string;
    type?: string;
    region?: string;
  };
  parameters?: {
    // Type action
    text?: string;
    clear_first?: boolean;

    // Scroll action
    direction?: "up" | "down" | "left" | "right";
    amount?: number;

    // Wait action
    duration?: number;

    // Key actions
    key?: string;
    keys?: string[];

    // Assert action
    expected_text?: string;

    // Drag and drop
    from_elementId?: string;
    to_elementId?: string;
    from_bbox?: [number, number, number, number];
    to_bbox?: [number, number, number, number];

    actions?: object[];
  };
  verify_immediately?: boolean;
  expected_outcome?: {
    verification_type: string;
    expected_content: string[];
  };
}

export interface BatchVerification {
  after_step: number;
  success_criteria: Array<{
    type: "text_present" | "element_visible" | "element_not_visible";
    content: string;
  }>;
}

export interface ActionPlan {
  test_id: string;
  current_step: number;
  status: "in_progress" | "completed" | "failed";
  actions: ActionStep[];
  batch_verification?: BatchVerification;
  next_action: "continue" | "complete" | "pause" | "retry";
  context: {
    test_data: {
      initial_prompt: string;
      previous_reasoning?: string;
    };
  };
  error_handling: {
    on_element_not_found: string;
    on_timeout: string;
  };
}

export interface ActionResult {
  step_id: number;
  success: boolean;
  error?: string;
  screenshot_after?: Screenshot;
  verification_result?: boolean;
}

// Langgraph state

export interface AgentState {
  // Input
  user_prompt: string;
  test_id: string;

  // Current iteration data
  perception_result?: PerceptionResult;
  action_plan?: ActionPlan;
  action_results?: ActionResult[];
  element_map?: Map<string, [number, number, number, number]>;

  // Loop control
  iteration_count: number;
  max_iterations: number;
  status: "running" | "completed" | "failed";

  // Error handling
  errors: string[];
  last_error?: string;
}

export interface NodeResult {
  success: boolean;
  data?: any;
  error?: string;
  next_step?: string;
}

export interface LLMContext {
  user_prompt: string;
  current_elements: UIElementForLLM[];
  iteration_count: number;
  previous_actions: ActionResult[];
  test_id: string;
}
