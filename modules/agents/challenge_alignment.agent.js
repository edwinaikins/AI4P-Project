import { callGemini } from "../../services/genai.service.js";

export default {
  id: "challenge_alignment",
  outputKey: "challenge_alignment_score",

  async run({ ideaText, challengeContext }) {
    const prompt = `
    You are evaluating an early-stage idea against a specific challenge.

    Your task is to assess ALIGNMENT WITH CHALLENGE GOALS.
    
    Using the challenge description, goals, and exclusions provided,
    assess whether the idea clearly and intentionally fits
    what the challenge is asking for.
    
    Scoring guidelines (0–100):
    0–30   Clearly misaligned
    31–60  Partial or unclear alignment
    61–80  Clear alignment
    81–100 Strong, intentional alignment
    
    STRICT RULES:
    - Do not judge idea quality overall
    - Judge alignment only
    - Penalize ideas that drift outside the challenge scope
    
    Return valid JSON only:
    {
      "score": <integer>,
      "confidence": <float 0–1>,
      "reasoning": "<short explanation>"
    }
    
    Challenge context:
    <challenge_description>
    
    Idea:    
    `;

    const response = await callGemini(prompt, ideaText, challengeContext);
    return response;
  },
};
