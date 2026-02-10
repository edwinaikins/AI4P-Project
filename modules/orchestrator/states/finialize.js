// states/finalize.js

import { pool } from "../../config/db.js";

/**
 * Persist evaluated idea (insert or update).
 * This keeps the explicit-column approach, but safely defaults values.
 */
async function insertNewIdea(idea_id, parsedIdea, challenge, final, author_id) {
  const {
    idea_title,
    problem_statement,
    proposed_ai_solution,
    potential_impact,
    key_features,
    technical_requirements,
    team,
    keywords,
  } = parsedIdea;

  // Explicit destructuring (old way, but safe defaults applied later)
  const {
    conceptual_feasibility_score,
    technical_direction_clarity_score,
    complexity_awareness_score,
    scalability_potential_score,
    originality_score,
    depth_of_thinking_score,
    differentiation_logic_score,
    problem_definition_quality_score,
    problem_solution_alignment_score,
    potential_impact_directional_score,
    beneficiary_awareness_score,
    ethical_awareness_score,
    risk_awareness_score,
    regulatory_sensitivity_score,
    clarity_of_expression_score,
    logical_coherence_score,
    idea_stage_completeness_score,
    context_awareness_score,
    adoption_plausibility_score,
    challenge_alignment_score,

    idea_category,
    idea_cluster,

    embedding,
    cluster_id,

    // 🔹 Idea-checker additions
    similarity_score,
    most_similar_idea,
  } = final;

  // ---------- INSERT ----------
  if (!idea_id) {
    const created_at = new Date();
    const updated_at = new Date();
    const status = "Under Review";
    const isdraft = false;

    const insertQuery = `
      INSERT INTO ideas (
        idea_title,
        problem_statement,
        proposed_ai_solution,
        potential_impact,
        key_features,
        technical_requirements,
        team,
        keywords,

        conceptual_feasibility_score,
    technical_direction_clarity_score,
    complexity_awareness_score,
    scalability_potential_score,
    originality_score,
    depth_of_thinking_score,
    differentiation_logic_score,
    problem_definition_quality_score,
    problem_solution_alignment_score,
    potential_impact_directional_score,
    beneficiary_awareness_score,
    ethical_awareness_score,
    risk_awareness_score,
    regulatory_sensitivity_score,
    clarity_of_expression_score,
    logical_coherence_score,
    idea_stage_completeness_score,
    context_awareness_score,
    adoption_plausibility_score,
    challenge_alignment_score,

        idea_category,
        idea_cluster,

        embedding,
        cluster_id,

        similarity_score,
        most_similar_idea,

        challenge,
        author_id,
        created_at,
        updated_at,
        status,
        isdraft
      )
      VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,
        $9,  $10, $11, $12,
        $13, $14,
        $15, $16,
        $17, $18,
        $19, $20, $21, $22, $23, $24
      )
    `;

    const insertValues = [
      idea_title,
      problem_statement,
      proposed_ai_solution,
      potential_impact,
      key_features,
      technical_requirements,
      team,
      keywords,

      // scores (safe defaults)
      conceptual_feasibility_score ?? null,
      technical_direction_clarity_score ?? null,
      complexity_awareness_score ?? null,
      scalability_potential_score ?? null,
      originality_score ?? null,
      depth_of_thinking_score ?? null,
      differentiation_logic_score ?? null,
      problem_definition_quality_score ?? null,
      problem_solution_alignment_score ?? null,
      potential_impact_directional_score ?? null,
      beneficiary_awareness_score ?? null,
      ethical_awareness_score ?? null,
      risk_awareness_score ?? null,
      regulatory_sensitivity_score ?? null,
      clarity_of_expression_score ?? null,
      logical_coherence_score ?? null,
      idea_stage_completeness_score ?? null,
      context_awareness_score ?? null,
      adoption_plausibility_score ?? null,
      challenge_alignment_score ?? null,

      // classification
      idea_category ?? null,
      idea_cluster ?? null,

      // infra
      embedding ?? null,
      cluster_id ?? null,

      // similarity metadata
      similarity_score ?? null,
      most_similar_idea ?? null,

      challenge,
      author_id,
      created_at,
      updated_at,
      status,
      isdraft,
    ];

    try {
      await pool.query(insertQuery, insertValues);
      return "success";
    } catch (err) {
      console.error("Failed to insert idea:", err.message);
      return "failed";
    }
  }

  // ---------- UPDATE ----------
  else {
    const updated_at = new Date();

    const updateQuery = `
      UPDATE ideas
      SET
        idea_title = $1,
        problem_statement = $2,
        proposed_ai_solution = $3,
        potential_impact = $4,
        key_features = $5,
        technical_requirements = $6,
        team = $7,
        keywords = $8,

        conceptual_feasibility_score = $9,
        technical_direction_clarity_score = $10,
        complexity_awareness_score = $11,
        scalability_potential_score = $12,
        originality_score = $13,
        depth_of_thinking_score = $14,
        differentiation_logic_score = $15,
        problem_definition_quality_score = $16,
        problem_solution_alignment_score = $17,
        potential_impact_directional_score = $18,
        beneficiary_awareness_score = $19,
        ethical_awareness_score = $20,
        risk_awareness_score = $21,
        regulatory_sensitivity_score = $22,
        clarity_of_expression_score = $23,
        logical_coherence_score = $24,
        idea_stage_completeness_score = $25,
        context_awareness_score = $26,
        adoption_plausibility_score = $27,
        challenge_alignment_score = $28,

        idea_category = $29,
        idea_cluster = $30,

        embedding = $31,
        cluster_id = $32,

        similarity_score = $33,
        most_similar_idea = $34,

        challenge = $35,
        author_id = $36,
        updated_at = $37
      WHERE id = $38
    `;

    const updateValues = [
      idea_title,
      problem_statement,
      proposed_ai_solution,
      potential_impact,
      key_features,
      technical_requirements,
      team,
      keywords,

      // scores
      conceptual_feasibility_score ?? null,
      technical_direction_clarity_score ?? null,
      complexity_awareness_score ?? null,
      scalability_potential_score ?? null,
      originality_score ?? null,
      depth_of_thinking_score ?? null,
      differentiation_logic_score ?? null,
      problem_definition_quality_score ?? null,
      problem_solution_alignment_score ?? null,
      potential_impact_directional_score ?? null,
      beneficiary_awareness_score ?? null,
      ethical_awareness_score ?? null,
      risk_awareness_score ?? null,
      regulatory_sensitivity_score ?? null,
      clarity_of_expression_score ?? null,
      logical_coherence_score ?? null,
      idea_stage_completeness_score ?? null,
      context_awareness_score ?? null,
      adoption_plausibility_score ?? null,
      challenge_alignment_score ?? null,

      // classification
      idea_category ?? null,
      idea_cluster ?? null,

      // infra
      embedding ?? null,
      cluster_id ?? null,

      // similarity
      similarity_score ?? null,
      most_similar_idea ?? null,

      challenge,
      author_id,
      updated_at,
      idea_id,
    ];

    try {
      await pool.query(updateQuery, updateValues);
      return "success";
    } catch (err) {
      console.error("Failed to update idea:", err.message);
      return "failed";
    }
  }
}

export default {
  async run(ctx) {
    if (ctx.challengeConfig?.persist !== false) {
      await insertNewIdea(
        ctx.idea_id,
        ctx.challengeConfig.parsedIdea,
        ctx.challengeConfig.challenge,
        ctx.final,
        ctx.author_id
      );
    }

    return {
      status: "success",
      results: ctx.final,
      logs: ctx.logs,
    };
  },
};
