import { callGemini } from "../../services/genai.service.js";

export default {
  id: "adoption_plausibility",
  outputKey: "adoption_plausibility_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess ADOPTION PLAUSIBILITY.
    
    Assess whether people could realistically
    adopt this idea in some form.
    
    Scoring guidelines (0–100):
    0–30   Adoption unrealistic
    31–60  Adoption unclear or difficult
    61–80  Plausible adoption
    81–100 Highly plausible adoption
    
    STRICT RULES:
    - Do not assess go-to-market strategy
    - Do not require validation
    - Focus on plausibility only
    
    Return valid JSON only:
    {
      "score": <integer>,
      "confidence": <float 0–1>,
      "reasoning": "<short explanation>"
    }
    
    Evaluate the following idea:    
    `;

    const response = await callGemini(prompt, new_idea);
    return response;
  },
};
