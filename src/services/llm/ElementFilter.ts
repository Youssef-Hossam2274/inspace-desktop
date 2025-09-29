import { ActionPlan, UIElement, ActionResult } from "../../agent/types";
import {LLM_API_CONFIG} from "../../config/LLMConfig"

export class ElementFilter {
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

    // Priority 4: Has meaningful content (not empty or too generic)
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
    if (element.interactivity === true) {
      return true;
    }
    // Fallback
    const type = element.type.toLowerCase();
    return this.INTERACTIVE_TYPES.some(t => type.includes(t));
  }
}