import { callGemini } from "../../services/genai.service.js";

export default {
  id: "logical_coherence",
  outputKey: "logical_coherence_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess LOGICAL COHERENCE.
    
    Assess whether the parts of the idea
    fit together logically.
    
    Scoring guidelines (0–100):
    0–30   Internally inconsistent
    31–60  Some logical gaps
    61–80  Mostly coherent
    81–100 Fully coherent and consistent
    
    STRICT RULES:
    - Do not assess correctness
    - Focus on internal logic only
    
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
