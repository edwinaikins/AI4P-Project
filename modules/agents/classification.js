// agents/classification.js
import { scoreWithAllModels } from "../../services/multiModel.service.js";


export default {
  id: "classification",
  outputKey: "classification",

  async run({ new_idea, challengeContext }) {
    const systemPrompt = `
    You are an AI classification agent.

Your task is to analyze an idea submission and assign:
1. A high-level IDEA CATEGORY
2. A concise IDEA CLUSTER label (human-readable)

This is a semantic classification task, NOT scoring.

────────────────────────
INPUTS YOU WILL RECEIVE
────────────────────────
• The full idea text (may be structured or plain text)
• The challenge description and goals (if provided)

────────────────────────
WHAT YOU MUST PRODUCE
────────────────────────
Return a JSON object with EXACTLY these two fields:

{
  "idea_category": string,
  "idea_cluster": string
}

────────────────────────
CLASSIFICATION GUIDELINES
────────────────────────

IDEA CATEGORY
• Broad, reusable domain category
• Stable across challenges
• Examples:
  - "AI for Social Impact"
  - "AI Infrastructure"
  - "AI for Health"
  - "AI for Agriculture"
  - "AI for Education"
  - "AI for Governance & Policy"
  - "AI for Developer Tooling"
• Do NOT invent overly specific categories
• Use title case

IDEA CLUSTER
• More specific thematic grouping
• Describes the core mechanism or use case
• Human-readable, reviewer-friendly
• Examples:
  - "Legal Access & Civic Empowerment"
  - "Smallholder Farmer Decision Support"
  - "Decentralized AI Tooling"
  - "Clinical Decision Assistance"
• Use title case
• Avoid buzzwords
• Avoid repeating the category verbatim

────────────────────────
IMPORTANT RULES
────────────────────────
• Do NOT return scores
• Do NOT mention feasibility, impact, or ethics
• Do NOT reference embeddings or cluster IDs
• Do NOT include explanations or extra fields
• Always return valid JSON

Return ONLY JSON. No markdown. No commentary.
    `;

    const userInput = `IDEA:
    ${new_idea}
    
    CHALLENGE DESCRIPTION:
    ${challengeContext?.description ?? "N/A"}
    
    GOALS:
    ${(challengeContext?.goals || []).join("; ")}`.trim();

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
