import { callGemini } from "../../services/genai.service.js";

export default {
  id: "scalability_potential",
  outputKey: "scalability_potential_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess SCALABILITY POTENTIAL.
    
    Assess whether the idea could scale in theory without relying on impossible,
    contradictory, or unrealistic assumptions.
    
    Scoring guidelines (0–100):
    0–30   Requires unrealistic assumptions to scale
    31–60  Scalability unclear or weakly implied
    61–80  Plausible scalability in principle
    81–100 Strong and coherent scalability potential
    
    STRICT RULES:
    - Do not require scaling strategies
    - Do not assess market size
    - Judge theoretical scalability only
    
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
