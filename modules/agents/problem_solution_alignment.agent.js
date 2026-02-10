import { callGemini } from "../../services/genai.service.js";

export default {
  id: "problem_solution_alignment",
  outputKey: "problem_solution_alignment_score",

  async run({ ideaText }) {
    const prompt = `
    You are evaluating an early-stage idea.

    Your task is to assess PROBLEM–SOLUTION ALIGNMENT.
    
    Assess whether the proposed idea logically addresses
    the stated problem.
    
    Scoring guidelines (0–100):
    0–30   Solution does not address problem
    31–60  Weak or partial alignment
    61–80  Clear logical alignment
    81–100 Strong and well-reasoned alignment
    
    STRICT RULES:
    - Do not assess effectiveness
    - Do not require validation
    - Focus on logical connection only
    
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
