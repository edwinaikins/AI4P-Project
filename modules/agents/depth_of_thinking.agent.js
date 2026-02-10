import { callGemini } from "../../services/genai.service.js";

export default {
  id: "depth_of_thinking",
  outputKey: "depth_of_thinking_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess DEPTH OF THINKING.
    
    Assess whether the idea goes beyond surface-level buzzwords
    and demonstrates reasoning, reflection, or insight.
    
    Scoring guidelines (0–100):
    0–30   Superficial or buzzword-driven
    31–60  Some reasoning but limited depth
    61–80  Thoughtful and reasoned
    81–100 Deeply considered and insightful
    
    STRICT RULES:
    - Do not reward length
    - Do not penalize simplicity
    - Focus on quality of thought
    
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
