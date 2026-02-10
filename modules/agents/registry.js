import conceptual_feasibility from "./conceptual_feasibility.agent.js";
import technical_direction_clarity from "./technical_direction_clarity.agent.js";
import complexity_awareness from "./complexity_awareness.agent.js";
import scalability_potential from "./scalability_potential.agent.js";

import originality from "./originality.agent.js";
import depth_of_thinking from "./depth_of_thinking.agent.js";
import differentiation_logic from "./differentiation_logic.agent.js";

import problem_definition_quality from "./problem_definition_quality.agent.js";
import problem_solution_alignment from "./problem_solution_alignment.agent.js";
import potential_impact_directional from "./potential_impact_directional.agent.js";
import beneficiary_awareness from "./beneficiary_awareness.agent.js";

import ethical_awareness from "./ethical_awareness.agent.js";
import risk_awareness from "./risk_awareness.agent.js";
import regulatory_sensitivity from "./regulatory_sensitivity.agent.js";

import clarity_of_expression from "./clarity_of_expression.agent.js";
import logical_coherence from "./logical_coherence.agent.js";
import idea_stage_completeness from "./idea_stage_completeness.agent.js";

import context_awareness from "./context_awareness.agent.js";
import adoption_plausibility from "./adoption_plausibility.agent.js";
import challenge_alignment from "./challenge_alignment.agent.js";

//import classification, { runClassificationAgent } from "./classification.js";

export const AGENT_REGISTRY = {
  conceptual_feasibility,
  technical_direction_clarity,
  complexity_awareness,
  scalability_potential,

  originality,
  depth_of_thinking,
  differentiation_logic,

  problem_definition_quality,
  problem_solution_alignment,
  potential_impact_directional,
  beneficiary_awareness,

  ethical_awareness,
  risk_awareness,
  regulatory_sensitivity,

  clarity_of_expression,
  logical_coherence,
  idea_stage_completeness,

  context_awareness,
  adoption_plausibility,
  challenge_alignment,

  classification,

  // classification: {
  //   run: async (ctx) =>
  //     runClassificationAgent({
  //       new_idea: ctx.new_idea,
  //       challengeConfig: ctx.challengeConfig,
  //     }),
  //   id: "classification",
  //   outputKey: "classification",
  // },
};
