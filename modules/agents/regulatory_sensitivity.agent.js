import { callGemini } from "../../services/genai.service.js";

export default {
  id: "regulatory_sensitivity",
  outputKey: "regulatory_sensitivity_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess REGULATORY SENSITIVITY.
    
    Assess whether the idea avoids obvious
    legal or regulatory red flags.
    
    Scoring guidelines (0–100):
    0–30   Clear regulatory red flags
    31–60  Potential concerns but unclear
    61–80  Generally aware or neutral
    81–100 Clearly sensitive to regulation
    
    STRICT RULES:
    - Do not require legal expertise
    - Do not require compliance plans
    - Judge obvious risk only
    
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
