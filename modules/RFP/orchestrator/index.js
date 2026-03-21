import { evaluateCriterion } from "../evaluateCriterion.js";
import { normalizeWeights, computeWeightedScore } from "../../utils/index.js";
import { aggregationAgent } from "../aggregationAgent.js";

export async function evaluateProposals(input) {
  const { rfp, proposal, proposals, criteria } = input;

  // Normalize proposals (single or multiple)
  const proposalList = proposals || (proposal ? [proposal] : []);

  if (!rfp || typeof rfp !== "string") {
    throw new Error("RFP must be a string");
  }

  if (!proposalList.length) {
    throw new Error("At least one proposal is required");
  }

  const weights = normalizeWeights(criteria);

  // STATE: PLAN
  const plan = criteria.map((c) => c.name);

  // STATE: EXECUTE
  const evaluated = await Promise.all(
    proposalList.map(async (proposalText) => {
      const results = {};

      for (const criterion of criteria) {
        const result = await evaluateCriterion({
          rfp,
          proposal: proposalText,
          criterion
        });

        results[criterion.name] = result;
      }

      // STATE: AGGREGATE (code-based)
      const finalScore = computeWeightedScore(results, weights);

      return {
        proposal: proposalText,
        scores: results,
        final_score: finalScore
      };
    })
  );

  return {
    status: "success",
    evaluation: {
      proposals: evaluated
    },
    logs: [
      { state: "INIT", ok: true },
      { state: "PLAN", agents: plan },
      { state: "EXECUTE", proposals: proposalList.length },
      { state: "AGGREGATE", ok: true }
    ]
  };
}