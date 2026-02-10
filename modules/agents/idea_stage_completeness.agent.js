import { callGemini } from "../../services/genai.service.js";

export default {
  id: "idea_stage_completeness",
  outputKey: "idea_stage_completeness_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess COMPLETENESS AT IDEA STAGE.
    
    Assess whether the idea is sufficiently developed
    for its maturity level.
    
    Scoring guidelines (0–100):
    0–30   Extremely underdeveloped
    31–60  Partially developed
    61–80  Appropriately complete
    81–100 Exceptionally well-developed for an idea
    
    STRICT RULES:
    - Do not require proposal-level detail
    - Judge relative to idea-stage expectations
    
    Return valid JSON only:
    {
      "score": <integer>,
      "confidence": <float 0–1>,
      "reasoning": "<short explanation>"
    }
    
    Evaluate the following idea:    
    `;

    try {
      return await callGemini(prompt, new_idea);
    } catch (error) {
      if (String(error.message).includes("429")) {
        await sleep(1000);
        return await callGemini(prompt, new_idea);
      }
      throw error;
    }
  },
};
