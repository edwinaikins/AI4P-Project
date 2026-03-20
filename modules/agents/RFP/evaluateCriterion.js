///RFP

import { scoreWithAllModels } from "../../../services/multiModel.service.js";
import { aggregateModelResponses } from "../../utils/index.js";

export async function evaluateCriterion({ rfp, proposal, criterion }) {
  const prompt = `
You are a strict and objective RFP evaluator.

Criterion:
Name: ${criterion.name}
Definition: ${criterion.description}

Instructions:
- Evaluate ONLY based on this criterion
- Be critical and evidence-based
- Avoid vague statements
- Return valid JSON only

Return:
{
  "score": number (1-10),
  "confidence": number (0-1),
  "reasoning": "...",
  "strengths": ["..."],
  "weaknesses": ["..."]
}
`;

  const input = {
    rfp,
    proposal
  };

  const responses = await scoreWithAllModels(prompt, String(input));

  const aggregated = aggregateModelResponses(responses);

  return {
    models: responses,
    ...aggregated
  };
}