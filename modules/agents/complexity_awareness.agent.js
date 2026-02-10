import { callGemini } from "../../services/genai.service.js";

export default {
  id: "complexity_awareness",
  outputKey: "complexity_awareness_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

Your task is to assess COMPLEXITY AWARENESS.

Assess whether the idea acknowledges that challenges, constraints, or tradeoffs exist,
even if they are not fully addressed or solved.

Scoring guidelines (0–100):
0–30   No awareness of complexity
31–60  Implicit or minimal awareness
61–80  Clear acknowledgement of challenges
81–100 Thoughtful awareness of complexity and limits

STRICT RULES:
- Do not penalize unsolved challenges
- Do not expect risk mitigation plans
- Focus on awareness, not solutions

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
