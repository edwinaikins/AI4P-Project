import { callGemini } from "../../services/genai.service.js";

export default {
  id: "clarity_of_expression",
  outputKey: "clarity_of_expression_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess CLARITY OF EXPRESSION.
    
    Assess whether the idea is understandable
    without insider knowledge.
    
    Scoring guidelines (0–100):
    0–30   Unclear or confusing
    31–60  Partially clear
    61–80  Mostly clear and understandable
    81–100 Exceptionally clear
    
    STRICT RULES:
    - Do not penalize technical ideas
    - Do not assess writing style
    - Focus on understandability
    
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
