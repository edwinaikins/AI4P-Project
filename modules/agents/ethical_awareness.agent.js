import { callGemini } from "../../services/genai.service.js";

export default {
  id: "ethical_awareness",
  outputKey: "ethical_awareness_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess ETHICAL AWARENESS.
    
    Assess whether the idea shows awareness of
    ethical considerations or potential harms.
    
    Scoring guidelines (0–100):
    0–30   No ethical awareness
    31–60  Minimal or implicit awareness
    61–80  Clear ethical awareness
    81–100 Thoughtful and responsible awareness
    
    STRICT RULES:
    - Do not require ethical solutions
    - Do not assume malicious intent
    - Focus on awareness, not mitigation
    
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
