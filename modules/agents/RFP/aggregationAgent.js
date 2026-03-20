///RFP

import { scoreWithAllModels } from "../../../services/multiModel.service.js";

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

  const input = {
    results,
    weights,
    finalScore
  };

  const responses = await scoreWithAllModels(prompt, input);

  // Simple aggregation (no need heavy math here)
  const valid = responses.filter(r => !r.error);

  const firstValid = valid[0] || {};

  return {
    models: responses,
    decision: firstValid.decision || "Borderline",
    summary: firstValid.summary || "",
    key_strengths: firstValid.key_strengths || [],
    key_risks: firstValid.key_risks || []
  };
}