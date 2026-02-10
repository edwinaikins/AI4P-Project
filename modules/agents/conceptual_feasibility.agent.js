import { callGemini } from "../../services/genai.service.js";

export default {
  id: "conceptual_feasibility",
  outputKey: "conceptual_feasibility_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess CONCEPTUAL FEASIBILITY.
    
    Assess whether the idea is plausible in principle, even if implementation details are missing.
    Do not penalize lack of detail if the concept itself makes sense.
    
    Scoring guidelines (0–100):
    0–30   Conceptually implausible or incoherent
    31–60  Plausible but weakly justified
    61–80  Plausible and reasonably grounded
    81–100 Strong, internally consistent concept
    
    STRICT RULES:
    - Do not assess implementation feasibility
    - Do not require proof, validation, or data
    - Judge only conceptual plausibility
    
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
