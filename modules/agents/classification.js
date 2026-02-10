// agents/classification.js

import { callGemini } from "../../services/genai.service.js";

// const SYSTEM_PROMPT = `
// You are an AI classification agent.

// Your task is to analyze an idea submission and assign:
// 1. A high-level IDEA CATEGORY
// 2. A concise IDEA CLUSTER label (human-readable)

// This is a semantic classification task, NOT scoring.

// ────────────────────────
// INPUTS YOU WILL RECEIVE
// ────────────────────────
// • The full idea text (may be structured or plain text)
// • The challenge description and goals (if provided)

// ────────────────────────
// WHAT YOU MUST PRODUCE
// ────────────────────────
// Return a JSON object with EXACTLY these two fields:

// {
//   "idea_category": string,
//   "idea_cluster": string
// }

// ────────────────────────
// CLASSIFICATION GUIDELINES
// ────────────────────────

// IDEA CATEGORY
// • Broad, reusable domain category
// • Stable across challenges
// • Examples:
//   - "AI for Social Impact"
//   - "AI Infrastructure"
//   - "AI for Health"
//   - "AI for Agriculture"
//   - "AI for Education"
//   - "AI for Governance & Policy"
//   - "AI for Developer Tooling"
// • Do NOT invent overly specific categories
// • Use title case

// IDEA CLUSTER
// • More specific thematic grouping
// • Describes the core mechanism or use case
// • Human-readable, reviewer-friendly
// • Examples:
//   - "Legal Access & Civic Empowerment"
//   - "Smallholder Farmer Decision Support"
//   - "Decentralized AI Tooling"
//   - "Clinical Decision Assistance"
// • Use title case
// • Avoid buzzwords
// • Avoid repeating the category verbatim

// ────────────────────────
// IMPORTANT RULES
// ────────────────────────
// • Do NOT return scores
// • Do NOT mention feasibility, impact, or ethics
// • Do NOT reference embeddings or cluster IDs
// • Do NOT include explanations or extra fields
// • Always return valid JSON

// Return ONLY JSON. No markdown. No commentary.
// `;

// export async function runClassificationAgent({ new_idea, challengeConfig }) {
//   if (!new_idea) {
//     throw new Error("Missing idea text for classification agent");
//   }

//   const ideaText =
//     typeof new_idea === "string" ? new_idea : JSON.stringify(new_idea, null, 2);

//   const challengeContext = challengeConfig
//     ? `
// Challenge Description:
// ${challengeConfig.description || "N/A"}

// Challenge Goals:
// ${
//   Array.isArray(challengeConfig.goals)
//     ? challengeConfig.goals.join(", ")
//     : "N/A"
// }
// `
//     : "";

//   const userPrompt = `
// IDEA:
// ${ideaText}

// ${challengeContext}
// `;

//   const response = await callGemini({
//     systemPrompt: SYSTEM_PROMPT,
//     userInput: userPrompt,
//     temperature: 0.2, // low variance for stable categories
//   });

//   let parsed;
//   try {
//     parsed = JSON.parse(response);
//   } catch (err) {
//     throw new Error("Classification agent returned invalid JSON");
//   }

//   // Hard validation (important)
//   if (
//     !parsed ||
//     typeof parsed.idea_category !== "string" ||
//     typeof parsed.idea_cluster !== "string"
//   ) {
//     throw new Error("Classification agent returned malformed output");
//   }

//   return {
//     idea_category: parsed.idea_category.trim(),
//     idea_cluster: parsed.idea_cluster.trim(),
//   };
// }

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
