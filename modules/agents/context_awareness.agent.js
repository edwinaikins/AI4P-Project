import { callGemini } from "../../services/genai.service.js";

export default {
  id: "context_awareness",
  outputKey: "context_awareness_score",

  async run({ new_idea, challengeContext }) {
    const systemPrompt = `
    You are evaluating an early-stage idea in the context of a specific challenge.

    Your task is to assess CONTEXT AWARENESS.
    
    Using the challenge description and goals provided,
    assess whether the idea reflects an understanding of:
    - its domain
    - its users
    - the environment implied by the challenge
    
    Scoring guidelines (0–100):
    0–30   No awareness of the challenge context
    31–60  Generic or weak context awareness
    61–80  Clear awareness of the challenge environment
    81–100 Deep and thoughtful context awareness
    
    STRICT RULES:
    - Do not invent context beyond the challenge
    - Do not assume external domain knowledge
    - Judge awareness relative to this challenge only
    
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
      return await callGemini(systemPrompt, userInput);
    } catch (error) {
      if (String(error.message).includes("429")) {
        await sleep(1000);
        return await callGemini(systemPrompt, userInput);
      }
      throw error;
    }
  },
};
