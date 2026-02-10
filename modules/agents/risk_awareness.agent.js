import { callGemini } from "../../services/genai.service.js";

export default {
  id: "risk_awareness",
  outputKey: "risk_awareness_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess RISK AWARENESS.
    
    Assess whether major risks or downsides
    are acknowledged at a high level.
    
    Scoring guidelines (0–100):
    0–30   No risk awareness
    31–60  Minimal acknowledgment of risks
    61–80  Clear awareness of key risks
    81–100 Thoughtful recognition of risks
    
    STRICT RULES:
    - Do not assess risk mitigation
    - Do not require completeness
    - Focus on acknowledgment only
    
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
