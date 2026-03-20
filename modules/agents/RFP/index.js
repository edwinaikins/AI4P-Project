import { evaluateCriterion } from "./evaluateCriterion.js";
import { normalizeWeights } from "../../utils/index.js";
import { computeWeightedScore } from "../../utils/index.js";
import { aggregationAgent } from "./aggregationAgent.js";

export async function evaluateProposal(input) {
  const { rfp, proposal, criteria } = input;

  // 1. Normalize weights
  const weights = normalizeWeights(criteria);

  // 2. Run all evaluation agents in parallel 🔥
  const evaluations = await Promise.all(
    criteria.map(async (c) => {
      const result = await evaluateCriterion({
        rfp,
        proposal,
        criterion: c
      });

      return { name: c.name, result };
    })
  );

  // 3. Structure results
  const results = {};
  evaluations.forEach(({ name, result }) => {
    results[name] = result;
  });

  // 4. Compute weighted score (CODE ONLY)
  const finalScore = computeWeightedScore(results, weights);

  // 5. Critical failure override 🔥
  const hasCriticalFailure = Object.values(results).some(
    (r) => r.score < 4
  );

  let aggregation;

  if (hasCriticalFailure) {
    aggregation = {
      decision: "Do Not Recommend",
      summary: "Critical weakness detected in at least one criterion.",
      key_strengths: [],
      key_risks: ["One or more criteria scored below acceptable threshold"]
    };
  } else {
    aggregation = await aggregationAgent({
      results,
      weights,
      finalScore
    });
  }

  return {
    status: "success",
    evaluation: {
      scores: results,
      weights,
      final_score: finalScore,
      ...aggregation
    }
  };
}