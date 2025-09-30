export interface Screenshot {
  data: string;
  timestamp: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface UIElement {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized coordinates
  content: string;
  type: string;
  confidence?: number;
  interactivity?: boolean;
}

export interface PerceptionResult {
  elements: UIElement[];
  screenshot: Screenshot;
  success: boolean;
  error?: string;
}

export interface ActionStep {
  step_id: number;
  action_type: "click" | "type" | "scroll" | "wait" | "screenshot";
  description: string;
  target: {
    bbox?: [number, number, number, number];
    content?: string;
    type?: string;
    region?: string;
  };
  parameters?: {
    text?: string;
    clear_first?: boolean;
    direction?: "up" | "down" | "left" | "right";
    amount?: number;
    duration?: number;
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
  current_elements: UIElement[];
  iteration_count: number;
  previous_actions: ActionResult[];
  test_id: string;
}