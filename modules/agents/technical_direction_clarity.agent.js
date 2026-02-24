import { scoreWithAllModels } from "../../services/multiModel.service.js";

export default {
  id: "technical_direction_clarity",
  outputKey: "technical_direction_clarity_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

Your task is to assess TECHNICAL DIRECTION CLARITY.

Assess whether the idea provides a clear high-level sense of how the solution would work,
without requiring detailed architecture or implementation steps.

Scoring guidelines (0–100):
0–30   No discernible technical direction
31–60  Vague or implicit technical direction
61–80  Clear high-level technical approach
81–100 Very clear and well-articulated technical direction

STRICT RULES:
- Do not penalize missing low-level details
- Do not require technical correctness
- Focus on clarity, not feasibility

Return valid JSON only:
{
  "score": <integer>,
  "confidence": <float 0–1>,
  "reasoning": "<short explanation>"
}

Evaluate the following idea:    
`;

    try {
      const results = await scoreWithAllModels(prompt, new_idea);
      return {
        [this.outputKey]: results,
      };
    } catch (error) {
      if (String(error.message).includes("429")) {
        await sleep(1000);
        return await callGemini(prompt, new_idea);
      }
      throw error;
    }
  },
};
