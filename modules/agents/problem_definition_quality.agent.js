import { scoreWithAllModels } from "../../services/multiModel.service.js";

export default {
  id: "problem_definition_quality",
  outputKey: "problem_definition_quality_score",

  async run({ new_idea }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess PROBLEM DEFINITION QUALITY.
    
    Assess whether the problem is clearly identified,
    coherent, and meaningful.
    
    Scoring guidelines (0–100):
    0–30   Problem unclear or trivial
    31–60  Problem stated but weakly framed
    61–80  Clear and meaningful problem
    81–100 Exceptionally well-defined problem
    
    STRICT RULES:
    - Do not assess solution quality
    - Do not require evidence of problem size
    - Focus on clarity and relevance
    
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
