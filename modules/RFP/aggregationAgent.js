///RFP

import { scoreWithAllModels } from "../../services/multiModel.service.js";

export async function aggregationAgent({ results, weights, finalScore }) {
  const prompt = `
You are a senior RFP evaluator.

Final Score: ${finalScore}

Tasks:
- Interpret the evaluation holistically
- Focus on risks and weaknesses
- Be critical and realistic

Decision Rules:
- Strongly Recommend: 8.5+
- Recommend: 7.0 – 8.49
- Borderline: 5.5 – 6.99
- Do Not Recommend: < 5.5

Return JSON:
{
  "decision": "...",
  "summary": "...",
  "key_strengths": ["..."],
  "key_risks": ["..."]
}
`;

  const userInput = `
  Results: ${JSON.stringify(results, null, 2)}
  Weights: ${JSON.stringify(weights, null, 2)}
  Final Score: ${finalScore}
  `;

  const responses = await scoreWithAllModels(prompt, userInput);

  // Simple aggregation (no need heavy math here)
  const valid = responses.filter(r => !r.error);

  const firstValid = valid[0] || {};

  return {
    models: responses,
    decision: responses.decision || "Borderline",
    summary: responses.summary || "",
    key_strengths: responses.key_strengths || [],
    key_risks: responses.key_risks || []
  };
}