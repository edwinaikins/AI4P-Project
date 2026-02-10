import { callGemini } from "../../services/genai.service.js";

export default {
  id: "originality",
  outputKey: "originality_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess ORIGINALITY.
    
    Assess whether the idea presents a fresh angle, novel framing,
    or interesting combination of concepts.
    
    Scoring guidelines (0–100):
    0–30   Generic or derivative
    31–60  Some originality but familiar
    61–80  Clearly original or novel
    81–100 Highly original and distinctive
    
    STRICT RULES:
    - Do not reward novelty for novelty’s sake
    - Do not assume prior art unless obvious
    - Judge originality of thinking, not execution
    
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
