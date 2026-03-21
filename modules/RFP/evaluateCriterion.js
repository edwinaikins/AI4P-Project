import { scoreWithAllModels } from "../../services/multiModel.service.js";
import {
  normalizeModelResponses,
  aggregateModelResponses,
} from "../utils/index.js";

export async function evaluateCriterion({ rfp, proposal, criterion }) {
  const prompt = `
You are a strict and objective RFP evaluator.

Criterion:
Name: ${criterion.name}
Definition: ${criterion.description}

Instructions:
- Evaluate ONLY based on this criterion
- Be critical and evidence-based
- Avoid vague statements and generalities

CRITICAL:
You MUST return ONLY valid JSON,
DO NOT include:
- any text outside JSON
- explanations, justifications, or reasoning outside the JSON

Return EXACTLY:
{
  "score": number (1-10),
  "confidence": number (1-10),
  "reasoning": string
}
`;

  const userInput = `
RFP:
${rfp}

Proposal:
${proposal}
`;

  // Step 1: call models
  const rawResponses = await scoreWithAllModels(prompt, userInput);

  // Step 2: normalize (THIS FIXES YOUR ERROR)
  const normalized = normalizeModelResponses(rawResponses);

  // Step 3: aggregate safely
  const aggregated = aggregateModelResponses(normalized);

  return {
    models: normalized,
    ...aggregated,
  };
}
