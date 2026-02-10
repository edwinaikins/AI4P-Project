import { callGemini } from "../../services/genai.service.js";

export default {
  id: "potential_impact_directional",
  outputKey: "potential_impact_directional_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess POTENTIAL IMPACT (DIRECTIONAL).
    
    If successful, could the idea plausibly create meaningful value?
    
    Scoring guidelines (0–100):
    0–30   Minimal or unclear potential impact
    31–60  Limited or niche impact
    61–80  Meaningful potential impact
    81–100 Potential for significant value creation
    
    STRICT RULES:
    - Do not assess likelihood of success
    - Do not require metrics
    - Judge directional impact only
    
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
