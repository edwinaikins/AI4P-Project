import { callGemini } from "../../services/genai.service.js";

export default {
  id: "beneficiary_awareness",
  outputKey: "beneficiary_awareness_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess BENEFICIARY AWARENESS.
    
    Assess whether the idea identifies who benefits
    and why those beneficiaries matter.
    
    Scoring guidelines (0–100):
    0–30   No clear beneficiaries
    31–60  Beneficiaries implied but unclear
    61–80  Clear beneficiary identification
    81–100 Strong understanding of beneficiaries
    
    STRICT RULES:
    - Do not assess market size
    - Do not require user research
    - Focus on awareness, not validation
    
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
