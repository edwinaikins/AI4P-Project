import { callGemini } from "../../services/genai.service.js";

export default {
  id: "differentiation_logic",
  outputKey: "differentiation_logic_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess DIFFERENTIATION LOGIC.
    
    Assess whether it is clear why this idea is different from
    or better than obvious alternatives.
    
    Scoring guidelines (0–100):
    0–30   No differentiation logic
    31–60  Weak or implicit differentiation
    61–80  Clear differentiation reasoning
    81–100 Strong and compelling differentiation logic
    
    STRICT RULES:
    - Do not require competitor analysis
    - Do not assess market positioning
    - Focus on conceptual differentiation
    
    Return valid JSON only:
    {
      "score": <integer>,
      "confidence": <float 0–1>,
      "reasoning": "<short explanation>"
    }
    
    Evaluate the following idea:
    
`;

    const response = await callGemini(prompt, ideaText);
    return response;
  },
};
