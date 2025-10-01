# System Diagrams

This document provides a breakdown of the **Perception Phase** and **Reasoning Phase** of the workflow using sequence diagrams.  

---

## 📑 Table of Contents
- [Perception Phase](#perception-phase)
- [Reasoning Phase](#reasoning-phase)

---

## 🔹 Perception Phase

The **Perception Phase** is responsible for capturing and analyzing the UI state of the system. It handles screenshot capturing, parsing via the Omni API, and generating perception results.

```mermaid
sequenceDiagram
    actor User
    participant Workflow as ExecuteWorkflow
    participant Graph as StateGraph
    participant Perception as PerceptionNode
    participant Screenshot as ScreenshotService
    participant OmniAPI as OmniparserAPI

    %% Initialization
    User->>Workflow: start(userPrompt)
    Workflow->>Graph: invoke(state)

    %% Perception Phase
    rect rgb(240, 248, 255)
    Note over Graph,OmniAPI: Perception Phase
    Graph->>Perception: execute(state)
    
    alt First iteration
        Perception->>Screenshot: captureScreenshot()
    else Subsequent iterations
        Perception->>Screenshot: captureMultipleRegions(targetRegions)
        Note right of Perception: Focus on 3x3 grid<br/>around last action
    end
    
    Screenshot-->>Perception: screenshot (base64)
    Perception->>OmniAPI: POST /parse (screenshot)
    OmniAPI-->>Perception: UI elements with bboxes
    Perception-->>Graph: perception_result
    end

```


## 🔹 Reasoning Phase

The **Reasoning Phase** interprets the perception results, filters possible UI actions, builds a prompt for the LLM, and retrieves the action plan from the Groq API.


```mermaid
    %% Reasoning Phase
  sequenceDiagram
    participant Graph as StateGraph
    participant Reasoning as ReasoningNode
    participant LLM as LLMService
    participant GroqAPI as GroqAPI

    %% Reasoning Phase
    rect rgb(255, 250, 240)
    Note over Graph,GroqAPI: Reasoning Phase
    Graph->>Reasoning: execute(state)
    Reasoning->>LLM: generateActionPlan(elements, prompt)
    
    LLM->>LLM: filterElements(top 50)
    Note right of LLM: Score by:<br/>Interactive +100<br/>Keyword match +50
    
    LLM->>LLM: buildPrompt(filteredElements)
    LLM->>GroqAPI: POST /chat/completions
    GroqAPI-->>LLM: ActionPlan JSON
    
    LLM-->>Reasoning: ActionPlan{actions[], next_action}
    Reasoning-->>Graph: action_plan
    end
```
