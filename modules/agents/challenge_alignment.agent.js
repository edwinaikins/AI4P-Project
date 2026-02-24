import { scoreWithAllModels } from "../../services/multiModel.service.js";

export default {
  id: "challenge_alignment",
  outputKey: "challenge_alignment_score",

  async run({ new_idea, challengeContext }) {
    const systemPrompt = `
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
    
    Evaluate the following idea:  
    `;

    const userInput = `IDEA:
    ${new_idea}
    
    CHALLENGE DESCRIPTION:
    ${challengeContext?.description ?? "N/A"}
    
    GOALS:
    ${(challengeContext?.goals || []).join("; ")}
    
    EXCLUSIONS:
    ${(challengeContext?.exclusions || []).join("; ")}`.trim();

    try {
      const results = await scoreWithAllModels(prompt, new_idea);
      return {
        [this.outputKey]: results,
      };
    } catch (error) {
      if (String(error.message).includes("429")) {
        await sleep(1000);
        return await callGemini(systemPrompt, userInput);
      }
      throw error;
    }
  },
};
